import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api';
import { useApp } from '../context/AppContext';
import { inr } from '../fmt';
import Tilt from '../components/Tilt';
import BankCard from '../components/BankCard';
import TxRow from '../components/TxRow';

const ACTIONS = [
  ['/money', '💰', 'Add money'],
  ['/transfer', '🔁', 'Send money'],
  ['/bills', '🧾', 'Pay a bill'],
  ['/loans', '🏦', 'Get a loan'],
];

export default function Dashboard() {
  const { user } = useApp();
  const [s, setS] = useState(null);

  useEffect(() => {
    api.get('/bank/summary').then((r) => setS(r.data)).catch(() => {});
  }, [user.balance]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <h1 className="title">
        {greet}, {user.name.split(' ')[0]}
      </h1>

      <div className="grid hero-grid">
        <Tilt className="glass balance-card">
          <small>{user.accountType} account</small>
          <div className="big">{inr(user.balance)}</div>
          <div className="acc">A/C {user.accountNumber}</div>
          <div className="mini-stats">
            <div>
              <small>Money in (30 days)</small>
              <b className="in">{s ? inr(s.income30) : '…'}</b>
            </div>
            <div>
              <small>Money out (30 days)</small>
              <b className="out">{s ? inr(s.expense30) : '…'}</b>
            </div>
          </div>
        </Tilt>
        <BankCard user={user} />
      </div>

      <div className="actions">
        {ACTIONS.map(([to, ico, label]) => (
          <Link key={to} to={to} className="action3d">
            <span>{ico}</span>
            {label}
          </Link>
        ))}
      </div>

      <div className="grid two">
        <Tilt className="glass panel" max={3}>
          <h3>Income vs spending</h3>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s?.chart || []} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
                <XAxis dataKey="month" stroke="#8fa7b5" tickLine={false} axisLine={false} />
                <YAxis stroke="#8fa7b5" tickLine={false} axisLine={false} width={60} />
                <Tooltip
                  formatter={(v) => inr(v)}
                  contentStyle={{ background: '#0b2433', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,.05)' }}
                />
                <Bar dataKey="income" name="Money in" fill="#5ee0c8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Money out" fill="#ff7a6b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tilt>

        <div className="glass panel">
          <div className="panel-head">
            <h3>Recent activity</h3>
            <Link to="/transactions">See all</Link>
          </div>
          <ul className="tx-list">
            {s?.recent?.length ? s.recent.map((t) => <TxRow key={t._id} t={t} />) : <li className="empty">No activity yet. Add money to get started.</li>}
          </ul>
        </div>
      </div>
    </>
  );
}
