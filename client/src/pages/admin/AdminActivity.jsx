import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api';
import { useApp } from '../../context/AppContext';
import { CREDIT, dateTime, inr, typeLabel } from '../../fmt';

export default function AdminActivity() {
  const { toast } = useApp();
  const [tab, setTab] = useState('transactions');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pages: 1, total: 0 });
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    if (tab !== 'transactions') return;
    api
      .get('/admin/transactions', { params: { type, search: applied, page, limit: 12 } })
      .then((r) => setData(r.data))
      .catch((e) => toast(errMsg(e), 'error'));
  }, [tab, type, applied, page, toast]);

  useEffect(() => {
    if (tab !== 'loans') return;
    api.get('/admin/loans').then((r) => setLoans(r.data.items)).catch((e) => toast(errMsg(e), 'error'));
  }, [tab, toast]);

  return (
    <>
      <h1 className="title">All activity</h1>
      <div className="glass panel">
        <div className="tabs small">
          <button className={tab === 'transactions' ? 'on' : ''} onClick={() => setTab('transactions')}>Transactions</button>
          <button className={tab === 'loans' ? 'on' : ''} onClick={() => setTab('loans')}>Loans</button>
        </div>

        {tab === 'transactions' ? (
          <>
            <div className="filters">
              <form
                className="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPage(1);
                  setApplied(search);
                }}
              >
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reference, customer, description" />
                <button className="btn ghost">Search</button>
              </form>
              <select
                className="inline-select"
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All types</option>
                {Object.entries(typeLabel).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 && (
                    <tr><td colSpan="6" className="empty">No transactions found.</td></tr>
                  )}
                  {data.items.map((t) => (
                    <tr key={t._id}>
                      <td>{dateTime(t.createdAt)}</td>
                      <td>
                        <b>{t.user?.name || 'Deleted user'}</b>
                        <small>{t.user?.accountNumber}</small>
                      </td>
                      <td>{typeLabel[t.type]}</td>
                      <td>{t.description}</td>
                      <td className={CREDIT.includes(t.type) ? 'in' : 'out'}>
                        {CREDIT.includes(t.type) ? '+' : '−'}{inr(t.amount)}
                      </td>
                      <td><small>{t.reference}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <button className="btn ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {data.page || page} of {data.pages} · {data.total} total</span>
              <button className="btn ghost" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Loan</th>
                  <th>Amount</th>
                  <th>EMI</th>
                  <th>Progress</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.length === 0 && (
                  <tr><td colSpan="7" className="empty">No loans have been issued.</td></tr>
                )}
                {loans.map((l) => (
                  <tr key={l._id}>
                    <td>
                      <b>{l.user?.name || 'Deleted user'}</b>
                      <small>{l.user?.email}</small>
                    </td>
                    <td>{l.type} · {l.rate}%</td>
                    <td>{inr(l.principal)}</td>
                    <td>{inr(l.emi)}</td>
                    <td>{l.paidEmis}/{l.months}</td>
                    <td>{inr(l.outstanding)}</td>
                    <td><span className={`badge ${l.status}`}>{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
