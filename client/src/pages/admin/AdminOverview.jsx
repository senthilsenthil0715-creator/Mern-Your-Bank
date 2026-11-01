import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg } from '../../api';
import { useApp } from '../../context/AppContext';
import { dateTime, inr } from '../../fmt';
import Tilt from '../../components/Tilt';

export default function AdminOverview() {
  const { toast } = useApp();
  const [s, setS] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then((r) => setS(r.data)).catch((e) => toast(errMsg(e), 'error'));
  }, [toast]);

  const tiles = s
    ? [
        ['Customers', s.customers, '🧑‍💼'],
        ['Total deposits held', inr(s.totalDeposits), '🏦'],
        ['Transactions', s.txCount, '🔁'],
        ['Active loans', `${s.activeLoans} · ${inr(s.loanOutstanding)} due`, '📆'],
        ['Suspended accounts', s.suspended, '⛔'],
      ]
    : [];

  return (
    <>
      <h1 className="title">Admin overview</h1>
      <div className="tiles">
        {!s && <div className="glass panel">Loading…</div>}
        {tiles.map(([label, value, ico]) => (
          <Tilt key={label} className="glass tile" max={10}>
            <span className="tile-ico">{ico}</span>
            <small>{label}</small>
            <b>{value}</b>
          </Tilt>
        ))}
      </div>

      <div className="grid two">
        <div className="glass panel">
          <h3>Money moved in the last 7 days</h3>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s?.chart || []} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
                <XAxis dataKey="day" stroke="#8fa7b5" tickLine={false} axisLine={false} />
                <YAxis stroke="#8fa7b5" tickLine={false} axisLine={false} width={60} />
                <Tooltip
                  formatter={(v, n) => (n === 'Volume' ? inr(v) : v)}
                  contentStyle={{ background: '#0b2433', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,.05)' }}
                />
                <Bar dataKey="volume" name="Volume" fill="#e8b563" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass panel">
          <h3>Newest customers</h3>
          <ul className="ben-list">
            {s?.newest?.map((u) => (
              <li key={u._id}>
                <div className="ben static">
                  <span className="avatar">{u.name[0]}</span>
                  <span>
                    <b>{u.name}</b>
                    <small>
                      {u.email} · joined {dateTime(u.createdAt)}
                    </small>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
