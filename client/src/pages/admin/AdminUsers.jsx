import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../../api';
import { useApp } from '../../context/AppContext';
import { dateTime, inr } from '../../fmt';
import TxRow from '../../components/TxRow';

function UserModal({ id, onClose, onChanged }) {
  const { user: me, toast } = useApp();
  const [d, setD] = useState(null);
  const [adj, setAdj] = useState({ direction: 'credit', amount: '', reason: '' });

  const load = useCallback(
    () => api.get(`/admin/users/${id}`).then((r) => setD(r.data)).catch((e) => toast(errMsg(e), 'error')),
    [id, toast]
  );
  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, after) => {
    try {
      const { data } = await fn();
      toast(data.message);
      await load();
      onChanged();
      if (after) after();
    } catch (e) {
      toast(errMsg(e), 'error');
    }
  };

  if (!d) return null;
  const u = d.user;
  const self = u._id === me._id;

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="glass modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h3>{u.name}</h3>
          <button className="x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-badges">
          <span className={`badge ${u.status}`}>{u.status}</span>
          <span className={`badge ${u.role === 'admin' ? 'admin' : 'closed'}`}>{u.role}</span>
        </div>
        <dl className="details">
          <dt>Email</dt><dd>{u.email}</dd>
          <dt>Phone</dt><dd>{u.phone || '—'}</dd>
          <dt>Account</dt><dd>{u.accountNumber} · {u.accountType}</dd>
          <dt>Balance</dt><dd><b>{inr(u.balance)}</b></dd>
          <dt>Joined</dt><dd>{dateTime(u.createdAt)}</dd>
          <dt>Loans</dt><dd>{d.loans.filter((l) => l.status === 'active').length} active of {d.loans.length}</dd>
        </dl>

        <h4>Adjust balance</h4>
        <form
          className="adjust"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => api.post(`/admin/users/${id}/adjust`, adj), () => setAdj({ ...adj, amount: '', reason: '' }));
          }}
        >
          <select value={adj.direction} onChange={(e) => setAdj({ ...adj, direction: e.target.value })}>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <input type="number" min="1" step="0.01" placeholder="Amount" value={adj.amount} onChange={(e) => setAdj({ ...adj, amount: e.target.value })} required />
          <input placeholder="Reason (required)" maxLength={80} value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} required />
          <button className="btn primary sm">Apply</button>
        </form>

        <div className="modal-actions">
          <button
            className={`btn ${u.status === 'active' ? 'danger' : 'primary'}`}
            disabled={self}
            onClick={() => run(() => api.patch(`/admin/users/${id}/status`, { status: u.status === 'active' ? 'suspended' : 'active' }))}
          >
            {u.status === 'active' ? 'Suspend account' : 'Reactivate account'}
          </button>
          <button className="btn ghost" disabled={self} onClick={() => run(() => api.patch(`/admin/users/${id}/role`, { role: u.role === 'admin' ? 'user' : 'admin' }))}>
            {u.role === 'admin' ? 'Remove admin rights' : 'Make admin'}
          </button>
          <button
            className="btn ghost"
            disabled={self}
            onClick={() => {
              if (window.confirm(`Permanently delete ${u.name} and all their data?`)) run(() => api.delete(`/admin/users/${id}`), onClose);
            }}
          >
            Delete user
          </button>
        </div>

        <h4>Recent transactions</h4>
        <ul className="tx-list">
          {d.transactions.length === 0 && <li className="empty">No transactions yet.</li>}
          {d.transactions.map((t) => (
            <TxRow key={t._id} t={t} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { toast } = useApp();
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pages: 1, total: 0 });
  const [open, setOpen] = useState(null);

  const load = useCallback(() => {
    api
      .get('/admin/users', { params: { search: applied, page, limit: 10 } })
      .then((r) => setData(r.data))
      .catch((e) => toast(errMsg(e), 'error'));
  }, [applied, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <h1 className="title">Manage users</h1>
      <div className="glass panel">
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setApplied(search);
          }}
        >
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or account number" />
          <button className="btn ghost">Search</button>
        </form>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Account</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty">No users found.</td>
                </tr>
              )}
              {data.items.map((u) => (
                <tr key={u._id} onClick={() => setOpen(u._id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(u._id)}>
                  <td>
                    <b>{u.name}</b>
                    <small>{u.email}</small>
                  </td>
                  <td>{u.accountNumber}</td>
                  <td>{inr(u.balance)}</td>
                  <td>
                    <span className={`badge ${u.status}`}>{u.status}</span>{' '}
                    {u.role === 'admin' && <span className="badge admin">admin</span>}
                  </td>
                  <td>{dateTime(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <button className="btn ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {data.page || page} of {data.pages} · {data.total} users</span>
          <button className="btn ghost" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
      {open && <UserModal id={open} onClose={() => setOpen(null)} onChanged={load} />}
    </>
  );
}
