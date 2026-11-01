import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useApp } from '../context/AppContext';
import { inr } from '../fmt';
import Tilt from '../components/Tilt';

export default function Transfer() {
  const { user, refreshUser, toast } = useApp();
  const [acc, setAcc] = useState('');
  const [holder, setHolder] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [bens, setBens] = useState([]);
  const [nick, setNick] = useState('');

  const loadBens = () => api.get('/beneficiaries').then((r) => setBens(r.data.items)).catch(() => {});
  useEffect(() => {
    loadBens();
  }, []);

  const lookup = async (value) => {
    setHolder(null);
    if (value.trim().length < 6) return;
    try {
      const { data } = await api.get(`/bank/lookup/${value.trim()}`);
      setHolder(data.name);
    } catch {
      setHolder(false);
    }
  };

  const pick = (b) => {
    setAcc(b.accountNumber);
    setHolder(b.name);
  };

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    setReceipt(null);
    try {
      const { data } = await api.post('/bank/transfer', { accountNumber: acc.trim(), amount, note });
      setReceipt({ ...data, amount: Number(amount), account: acc.trim() });
      toast('Transfer successful');
      setAmount('');
      setNote('');
      await refreshUser();
    } catch (err) {
      toast(errMsg(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const saveBen = async () => {
    try {
      await api.post('/beneficiaries', { accountNumber: acc.trim(), nickname: nick });
      toast('Beneficiary saved');
      setNick('');
      loadBens();
    } catch (err) {
      toast(errMsg(err), 'error');
    }
  };

  const removeBen = async (id) => {
    try {
      await api.delete(`/beneficiaries/${id}`);
      toast('Beneficiary removed');
      loadBens();
    } catch (err) {
      toast(errMsg(err), 'error');
    }
  };

  const saved = bens.some((b) => b.accountNumber === acc.trim());

  return (
    <>
      <h1 className="title">Send money</h1>
      <div className="grid two">
        <Tilt className="glass panel" max={3}>
          <form onSubmit={send}>
            <label className="field">
              Receiver account number
              <input
                value={acc}
                onChange={(e) => {
                  setAcc(e.target.value);
                  lookup(e.target.value);
                }}
                placeholder="12-digit account number"
                inputMode="numeric"
                required
              />
            </label>
            {holder && <div className="verify ok">✔ {holder}</div>}
            {holder === false && <div className="verify bad">No account found with this number</div>}
            {holder && !saved && (
              <div className="row save-ben">
                <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Nickname (optional)" maxLength={30} />
                <button type="button" className="btn ghost" onClick={saveBen}>
                  Save beneficiary
                </button>
              </div>
            )}
            <label className="field">
              Amount (₹)
              <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
            </label>
            <label className="field">
              Note (optional)
              <input value={note} maxLength={100} onChange={(e) => setNote(e.target.value)} placeholder="Dinner split, rent…" />
            </label>
            <p className="muted">Available: {inr(user.balance)}</p>
            <button className="btn primary block" disabled={busy}>
              {busy ? 'Sending…' : 'Send money'}
            </button>
          </form>

          {receipt && (
            <div className="receipt">
              <b>Sent {inr(receipt.amount)} to {receipt.receiver}</b>
              <small>A/C {receipt.account}</small>
              <small>Reference {receipt.reference}</small>
            </div>
          )}
        </Tilt>

        <div className="glass panel">
          <h3>Saved beneficiaries</h3>
          <ul className="ben-list">
            {bens.length === 0 && <li className="empty">No beneficiaries yet. Enter an account number and save it for next time.</li>}
            {bens.map((b) => (
              <li key={b._id}>
                <button className="ben" onClick={() => pick(b)}>
                  <span className="avatar">{b.name[0]}</span>
                  <span>
                    <b>{b.nickname || b.name}</b>
                    <small>
                      {b.name} · {b.accountNumber}
                    </small>
                  </span>
                </button>
                <button className="x" onClick={() => removeBen(b._id)} aria-label={`Remove ${b.name}`}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <p className="muted">Your account number: <b>{user.accountNumber}</b></p>
        </div>
      </div>
    </>
  );
}
