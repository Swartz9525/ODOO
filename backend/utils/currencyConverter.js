// Simple currency conversion utility
// In production, you would use a service like Fixer.io, Open Exchange Rates, etc.

const exchangeRates = {
  USD: { EUR: 0.85, GBP: 0.73, INR: 74.5, JPY: 110.0 },
  EUR: { USD: 1.18, GBP: 0.86, INR: 87.5, JPY: 129.5 },
  GBP: { USD: 1.37, EUR: 1.16, INR: 101.5, JPY: 150.0 },
  INR: { USD: 0.013, EUR: 0.011, GBP: 0.0098, JPY: 1.47 },
  JPY: { USD: 0.0091, EUR: 0.0077, GBP: 0.0067, INR: 0.68 },
};

export async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return parseFloat(amount);
  }

  const rate = exchangeRates[fromCurrency]?.[toCurrency];
  if (!rate) {
    throw new Error(`Conversion rate not available from ${fromCurrency} to ${toCurrency}`);
  }

  return parseFloat(amount) * rate;
}