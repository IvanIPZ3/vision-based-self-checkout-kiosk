export const formatCurrency = (value: number): string => {
  const hasFraction = Math.abs(value % 1) > Number.EPSILON;

  return `${new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value)} грн`;
};
