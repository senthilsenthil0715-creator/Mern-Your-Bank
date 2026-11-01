export const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n) || 0);

export const dateTime = (d) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const CREDIT = ['deposit', 'transfer_in', 'loan_credit'];

export const typeLabel = {
  deposit: 'Deposit',
  withdraw: 'Withdrawal',
  transfer_out: 'Transfer sent',
  transfer_in: 'Transfer received',
  bill: 'Bill payment',
  loan_credit: 'Loan credited',
  loan_payment: 'Loan EMI',
};

export const typeIcon = {
  deposit: '⬇️',
  withdraw: '⬆️',
  transfer_out: '📤',
  transfer_in: '📥',
  bill: '🧾',
  loan_credit: '🏠',
  loan_payment: '📆',
};

export const spaceCard = (n = '') => String(n).replace(/(\d{4})(?=\d)/g, '$1 ');
