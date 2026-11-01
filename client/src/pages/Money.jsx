import { useState } from 'react';
import api, { errMsg } from '../api';
import { useApp } from '../context/AppContext';
import { inr } from '../fmt';
import Tilt from '../components/Tilt';

const QUICK = [500, 1000, 5000, 10000];

export default function Money() {
  const { user, refreshUser, toast } = useApp();
  const [tab, setTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(`/bank/${tab}`, { amount, note });
      toast(`${data.message}. New balance ${inr(data.balance)}`);
      setAmount('');
      setNote('');
      await refreshUser();
    } catch (err) {
      toast(errMsg(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1 className="title">Deposit & withdraw</h1>
      <div className="grid two">
        <Tilt className="glass panel" max={3}>
          <div className="tabs">
            <button className={tab === 'deposit' ? 'on' : ''} onClick={() => setTab('deposit')}>
              Deposit
            </button>
            <button className={tab === 'withdraw' ? 'on' : ''} onClick={() => setTab('withdraw')}>
              Withdraw
            </button>
          </div>
          <form onSubmit={submit}>
            <label className="field">
              Amount (₹)
              <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
            </label>
            <div className="chips">
              {QUICK.map((q) => (
                <button type="button" key={q} onClick={() => setAmount(String(q))}>
                  {inr(q)}
                </button>
              ))}
            </div>
            <label className="field">
              Note (optional)
              <input value={note} maxLength={100} onChange={(e) => setNote(e.target.value)} placeholder={tab === 'deposit' ? 'Salary, savings…' : 'Rent, groceries…'} />
            </label>
            <button className="btn primary block" disabled={busy}>
              {busy ? 'Processing…' : tab === 'deposit' ? 'Deposit money' : 'Withdraw money'}
            </button>
          </form>
        </Tilt>

        <Tilt className="glass panel center-panel" max={5}>
          <small>Available balance</small>
          <div className="big">{inr(user.balance)}</div>
          <p className="muted">Deposits are credited instantly. Withdrawals cannot exceed your balance.</p>
        </Tilt>
      </div>
    </>
  );
}
