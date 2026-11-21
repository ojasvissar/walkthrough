export function validatePayment(total, currency) {
  return Number.isSafeInteger(total) && total > 0 && currency === 'USD';
}

export function chargeOrder(total, currency) {
  if (!validatePayment(total, currency)) throw new Error('Invalid payment total or currency.');
  return { total, currency, receipt: crypto.randomUUID() };
}
