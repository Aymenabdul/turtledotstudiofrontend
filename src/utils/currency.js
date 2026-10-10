export const getCurrencySymbol = (currency = 'USD') => {
  switch ((currency || 'USD').toUpperCase()) {
    case 'INR':
      return '₹';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'JPY':
      return '¥';
    case 'CAD':
      return 'CA$';
    case 'AUD':
      return 'A$';
    case 'USD':
    default:
      return '$';
  }
};

export const formatCurrency = (amount, currency = 'USD') => {
  const num = Number(amount) || 0;
  const curr = (currency || 'USD').toUpperCase();
  const locale = curr === 'INR' ? 'en-IN' : 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch (e) {
    const symbol = getCurrencySymbol(curr);
    return `${symbol}${num.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

export const getDefaultExchangeRate = (fromCurrency = 'USD', toCurrency = 'INR') => {
  const from = (fromCurrency || 'USD').toUpperCase();
  const to = (toCurrency || 'INR').toUpperCase();
  if (from === to) return 1.0;

  // Conversion rates to USD as base
  const toUsd = {
    USD: 1.0,
    INR: 0.01205, // ~1 / 83
    EUR: 1.08,
    GBP: 1.30,
    CAD: 0.74,
    AUD: 0.67,
    JPY: 0.0069,
  };

  const fromInUsd = toUsd[from] || 1.0;
  const toInUsd = toUsd[to] || 1.0;
  const rate = fromInUsd / toInUsd;
  return Number(rate.toFixed(4));
};
