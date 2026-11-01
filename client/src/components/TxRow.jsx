import { CREDIT, dateTime, inr, typeIcon, typeLabel } from '../fmt';

export default function TxRow({ t }) {
  const credit = CREDIT.includes(t.type);
  return (
    <li className="tx">
      <span className={`tx-ico ${credit ? 'in' : 'out'}`}>{typeIcon[t.type]}</span>
      <div className="tx-main">
        <b>{t.description || typeLabel[t.type]}</b>
        <small>
          {typeLabel[t.type]} · {dateTime(t.createdAt)}
        </small>
      </div>
      <div className={`tx-amt ${credit ? 'in' : 'out'}`}>
        {credit ? '+' : '−'}
        {inr(t.amount)}
        <small>Bal {inr(t.balanceAfter)}</small>
      </div>
    </li>
  );
}
