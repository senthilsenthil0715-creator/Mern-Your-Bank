import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { errMsg } from '../api';
import Background3D from '../components/Background3D';
import Tilt from '../components/Tilt';

const CUBE_FACES = [
  ['f', 'Your'],
  ['b', 'Bank'],
  ['r', '₹'],
  ['l', '🔒'],
  ['t', '💳'],
  ['u', '🏦'],
];

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { login, register, toast } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', accountType: 'Savings' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isLogin) await login(f.email, f.password);
      else await register(f);
      toast(isLogin ? 'Welcome back!' : 'Account created. ₹5,000 welcome bonus added.');
      nav('/');
    } catch (err) {
      toast(errMsg(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <Background3D />
      <section className="auth-hero">
        <div className="hero-scene">
          <div className="hero-cube">
            {CUBE_FACES.map(([c, t]) => (
              <div key={c} className={`hface ${c}`}>
                {t}
              </div>
            ))}
          </div>
        </div>
        <h1>Money that moves the way you do.</h1>
        <p>Transfer, save, borrow and pay bills from one secure vault. Open an account in under a minute.</p>
      </section>

      <Tilt className="glass auth-card" max={4}>
        <h2>{isLogin ? 'Log in to Your Bank' : 'Open your account'}</h2>
        <form onSubmit={submit}>
          {!isLogin && (
            <label className="field">
              Full name
              <input value={f.name} onChange={set('name')} placeholder="Asha Raman" required />
            </label>
          )}
          <label className="field">
            Email
            <input type="email" value={f.email} onChange={set('email')} placeholder="you@example.com" required />
          </label>
          {!isLogin && (
            <div className="row">
              <label className="field">
                Phone
                <input value={f.phone} onChange={set('phone')} placeholder="98765 43210" />
              </label>
              <label className="field">
                Account type
                <select value={f.accountType} onChange={set('accountType')}>
                  <option>Savings</option>
                  <option>Current</option>
                </select>
              </label>
            </div>
          )}
          <label className="field">
            Password
            <input type="password" value={f.password} onChange={set('password')} placeholder="At least 6 characters" minLength={6} required />
          </label>
          <button className="btn primary block" disabled={busy}>
            {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
          </button>
        </form>
        <p className="switch">
          {isLogin ? (
            <>
              New to Your Bank? <Link to="/register">Open an account</Link>
            </>
          ) : (
            <>
              Already a customer? <Link to="/login">Log in</Link>
            </>
          )}
        </p>
      </Tilt>
    </div>
  );
}
