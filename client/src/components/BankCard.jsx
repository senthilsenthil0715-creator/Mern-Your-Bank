import { useState } from 'react';
import { spaceCard } from '../fmt';

export default function BankCard({ user }) {
  const [flip, setFlip] = useState(false);
  const c = user.card || {};
  return (
    <div
      className="card3d-wrap"
      onClick={() => setFlip((f) => !f)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setFlip((f) => !f)}
      aria-label="Debit card. Press to flip."
    >
      <div className={`card3d ${flip ? 'flipped' : ''} ${c.frozen ? 'frozen' : ''}`}>
        <div className="card-face front">
          <div className="card-top">
            <strong className="brand-mark">Your Bank</strong>
            <span className="contactless">)))</span>
          </div>
          <div className="chip" />
          <div className="card-number">{spaceCard(c.number)}</div>
          <div className="card-bottom">
            <div>
              <small>Card holder</small>
              <b>{user.name}</b>
            </div>
            <div>
              <small>Expires</small>
              <b>{c.expiry}</b>
            </div>
            <span className="visa">VISA</span>
          </div>
          {c.frozen && <div className="frozen-badge">Frozen</div>}
        </div>
        <div className="card-face back">
          <div className="mag" />
          <div className="sig">
            <span>Authorised signature</span>
            <b className="cvv">{c.cvv}</b>
          </div>
          <p>Tap to flip back. Never share your CVV with anyone.</p>
        </div>
      </div>
    </div>
  );
}
