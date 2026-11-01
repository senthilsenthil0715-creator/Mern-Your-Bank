import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Background3D from './Background3D';
import { inr } from '../fmt';

const NAV = [
  ['/', '🏠', 'Dashboard'],
  ['/money', '💰', 'Deposit & withdraw'],
  ['/transfer', '🔁', 'Transfer'],
  ['/transactions', '📜', 'Transactions'],
  ['/cards', '💳', 'My card'],
  ['/loans', '🏦', 'Loans'],
  ['/bills', '🧾', 'Pay bills'],
  ['/profile', '👤', 'Profile'],
];

const ADMIN_NAV = [
  ['/admin', '📊', 'Admin overview'],
  ['/admin/users', '🧑‍💼', 'Manage users'],
  ['/admin/transactions', '🔎', 'All activity'],
];

export default function Layout() {
  const { user, logout } = useApp();
  return (
    <div className="app">
      <Background3D />
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-cube">🏦</span>
          <b>Your Bank</b>
        </div>
        <nav>
          {NAV.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span>{icon}</span>
              <em>{label}</em>
            </NavLink>
          ))}
          {user.role === 'admin' && (
            <>
              <div className="nav-label">Admin</div>
              {ADMIN_NAV.map(([to, icon, label]) => (
                <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => (isActive ? 'active' : '')}>
                  <span>{icon}</span>
                  <em>{label}</em>
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <button className="btn ghost logout" onClick={logout}>
          Log out
        </button>
      </aside>
      <div className="content">
        <header className="topbar">
          <div>
            <small>Signed in as</small>
            <b>
              {user.name} {user.role === 'admin' && <span className="badge admin">Admin</span>}
            </b>
          </div>
          <div className="top-balance">
            <small>Available balance</small>
            <b>{inr(user.balance)}</b>
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
