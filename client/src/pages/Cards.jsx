import { useState } from 'react';
import api, { errMsg } from '../api';
import { useApp } from '../context/AppContext';
import BankCard from '../components/BankCard';

export default function Cards() {
  const { user, setUser, toast } = useApp();
  const [busy, setBusy] = useState(false);
  const frozen = user.card?.frozen;

  const act = async (path) => {
    setBusy(true);
    try {
      const { data } = await api.post(`/card/${path}`);
      setUser((u) => ({ ...u, card: data.card }));
      toast(data.message);
    } catch (err) {
      toast(errMsg(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const replace = () => {
    if (window.confirm('Issue a new card? Your current card number will stop working.')) act('replace');
  };

  return (
    <>
      <h1 className="title">My card</h1>
      <div className="grid two">
        <div className="card-stage">
          <BankCard user={user} />
          <p className="muted center">Tap the card to see the back.</p>
        </div>
        <div className="glass panel">
          <h3>Card controls</h3>
          <div className="control">
            <div>
              <b>{frozen ? 'Card is frozen' : 'Card is active'}</b>
              <small>{frozen ? 'Online and in-store payments are blocked.' : 'Freeze your card instantly if you misplace it.'}</small>
            </div>
            <button className={`btn ${frozen ? 'primary' : 'danger'}`} disabled={busy} onClick={() => act('freeze')}>
              {frozen ? 'Unfreeze card' : 'Freeze card'}
            </button>
          </div>
          <div className="control">
            <div>
              <b>Lost or compromised?</b>
              <small>Get a new card number, expiry and CVV.</small>
            </div>
            <button className="btn ghost" disabled={busy} onClick={replace}>
              Replace card
            </button>
          </div>
          <div className="control">
            <div>
              <b>Card type</b>
              <small>Virtual debit · linked to {user.accountType} account {user.accountNumber}</small>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
