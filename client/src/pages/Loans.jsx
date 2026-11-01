import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useApp } from '../context/AppContext';
import { inr } from '../fmt';
import Tilt from '../components/Tilt';

const RATES = { Personal: 11.5, Home: 8.5, Car: 9.5, Education: 7.5 };

const emiOf = (p, rate, n) => {
  const r = rate / 12 / 100;
  const f = Math.pow(1 + r, n);
  return Math.round(((p * r * f) / (f - 1)) * 100) / 100;
};

export default function Loans() {
  const { refreshUser, toast } = useApp();
  const [type, setType] = useState('Personal');
  const [principal, setPrincipal] = useState(100000);
  const [months, setMonths] = useState(24);
  const [loans, setLoans] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/loans').then((r) => setLoans(r.data.items)).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const rate = RATES[type];
  const emi = emiOf(Number(principal) || 0, rate, Number(months) || 1);
  const total = emi * months;

  const apply = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/loans/apply', { type, principal, months });
      toast(data.message);
      await Promise.all([load(), refreshUser()]);
    } catch (err) {
      toast(errMsg(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const pay = async (id) => {
    try {
      const { data } = await api.post(`/loans/${id}/pay`);
      toast(data.message);
      await Promise.all([load(), refreshUser()]);
    } catch (err) {
      toast(errMsg(err), 'error');
    }
  };

  return (
    <>
      <h1 className="title">Loans</h1>
      <div className="grid two">
        <Tilt className="glass panel" max={3}>
          <h3>Loan calculator</h3>
          <div className="tabs small">
            {Object.keys(RATES).map((t) => (
              <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>
                {t}
              </button>
            ))}
          </div>
          <label className="field">
            Amount: <b>{inr(principal)}</b>
            <input type="range" min="10000" max="2000000" step="5000" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} />
          </label>
          <label className="field">
            Tenure: <b>{months} months</b>
            <input type="range" min="6" max="240" step="6" value={months} onChange={(e) => setMonths(Number(e.target.value))} />
          </label>
          <div className="emi-box">
            <small>Monthly EMI at {rate}% p.a.</small>
            <div className="big">{inr(emi)}</div>
            <small>Total repayment {inr(total)} · Interest {inr(total - principal)}</small>
          </div>
          <button className="btn primary block" onClick={apply} disabled={busy}>
            {busy ? 'Applying…' : 'Apply for this loan'}
          </button>
          <p className="muted">Approved loans are credited to your account immediately.</p>
        </Tilt>

        <div className="glass panel">
          <h3>Your loans</h3>
          {loans.length === 0 && <p className="empty">You have no loans. Use the calculator to apply for one.</p>}
          {loans.map((l) => (
            <div className="loan" key={l._id}>
              <div className="loan-head">
                <b>{l.type} loan</b>
                <span className={`badge ${l.status}`}>{l.status}</span>
              </div>
              <small>
                {inr(l.principal)} · {l.rate}% · {l.months} months · EMI {inr(l.emi)}
              </small>
              <div className="progress">
                <i style={{ width: `${(l.paidEmis / l.months) * 100}%` }} />
              </div>
              <div className="loan-foot">
                <small>
                  {l.paidEmis}/{l.months} paid · Outstanding {inr(l.outstanding)}
                </small>
                {l.status === 'active' && (
                  <button className="btn primary sm" onClick={() => pay(l._id)}>
                    Pay EMI
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
