import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useApp } from '../context/AppContext';
import { CREDIT, dateTime, typeLabel } from '../fmt';
import TxRow from '../components/TxRow';

export default function Transactions() {
  const { toast } = useApp();
  const [kind, setKind] = useState('');
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/bank/transactions', { params: { kind, search: applied, page, limit: 10 } })
      .then((r) => setData(r.data))
      .catch((e) => toast(errMsg(e), 'error'))
      .finally(() => setLoading(false));
  }, [kind, applied, page, toast]);

  const exportCsv = async () => {
    try {
      const { data: d } = await api.get('/bank/transactions', { params: { kind, search: applied, limit: 500 } });
      const rows = [['Date', 'Reference', 'Type', 'Direction', 'Description', 'Amount', 'Balance after']];
      d.items.forEach((t) =>
        rows.push([dateTime(t.createdAt), t.reference, typeLabel[t.type], CREDIT.includes(t.type) ? 'Credit' : 'Debit', t.description, t.amount, t.balanceAfter])
      );
      const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'your-bank-statement.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(errMsg(err), 'error');
    }
  };

  const doSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setApplied(search);
  };

  return (
    <>
      <h1 className="title">Transactions</h1>
      <div className="glass panel">
        <div className="filters">
          <form onSubmit={doSearch} className="search">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description, reference…" />
            <button className="btn ghost">Search</button>
          </form>
          <div className="tabs small">
            {[['', 'All'], ['credit', 'Money in'], ['debit', 'Money out']].map(([k, l]) => (
              <button
                key={k}
                className={kind === k ? 'on' : ''}
                onClick={() => {
                  setKind(k);
                  setPage(1);
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <button className="btn ghost" onClick={exportCsv}>
            Export CSV
          </button>
        </div>

        <ul className="tx-list">
          {loading && <li className="empty">Loading…</li>}
          {!loading && data.items.length === 0 && <li className="empty">No transactions match these filters.</li>}
          {!loading && data.items.map((t) => <TxRow key={t._id} t={t} />)}
        </ul>

        <div className="pager">
          <button className="btn ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            Page {data.page || page} of {data.pages} · {data.total} total
          </span>
          <button className="btn ghost" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>
    </>
  );
}
