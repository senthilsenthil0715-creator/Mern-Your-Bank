import { useState } from 'react';
import api, { errMsg } from '../api';
import { useApp } from '../context/AppContext';
import { inr } from '../fmt';
import Tilt from '../components/Tilt';

const CATS = {
  Electricity: { icon: '💡', billers: ['State Power Board', 'City Electric Co.'] },
  Water: { icon: '🚰', billers: ['Municipal Water Supply'] },
  Mobile: { icon: '📱', billers: ['AirLink Mobile', 'Jio Connect', 'Vi Prepaid'] },
  Internet: { icon: '🌐', billers: ['FiberNet Broadband', 'SkyWave Internet'] },
  Gas: { icon: '🔥', billers: ['Indane Gas', 'HP Gas'] },
  DTH: { icon: '📺', billers: ['Tata Play', 'Dish TV'] },
  Insurance: { icon: '🛡️', billers: ['LifeSure Insurance', 'HealthFirst'] },
};

export default function Bills() {
  const { user, refreshUser, toast } = useApp();
  const [cat, setCat] = useState('Electricity');
  const [biller, setBiller] = useState(CATS.Electricity.billers[0]);
  const [consumerNumber, setConsumerNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const choose = (c) => {
    setCat(c);
    setBiller(CATS[c].billers[0]);
  };

  const pay = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/bank/bills/pay', { biller, category: cat, consumerNumber, amount });
      toast(`${data.message} ${inr(amount)} paid to ${biller}`);
      setConsumerNumber('');
      setAmount('');
      await refreshUser();
    } catch (err) {
      toast(errMsg(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1 className="title">Pay bills</h1>
      <div className="cat-grid">
        {Object.entries(CATS).map(([c, v]) => (
          <button key={c} className={`action3d ${cat === c ? 'sel' : ''}`} onClick={() => choose(c)}>
            <span>{v.icon}</span>
            {c}
          </button>
        ))}
      </div>
      <Tilt className="glass panel narrow" max={2}>
        <h3>{cat} bill</h3>
        <form onSubmit={pay}>
          <label className="field">
            Biller
            <select value={biller} onChange={(e) => setBiller(e.target.value)}>
              {CATS[cat].billers.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Consumer / customer number
            <input value={consumerNumber} onChange={(e) => setConsumerNumber(e.target.value)} placeholder="Found on your bill" required />
          </label>
          <label className="field">
            Amount (₹)
            <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
          </label>
          <p className="muted">Available: {inr(user.balance)}</p>
          <button className="btn primary block" disabled={busy}>
            {busy ? 'Paying…' : 'Pay bill'}
          </button>
        </form>
      </Tilt>
    </>
  );
}
