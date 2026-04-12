/** Format EIN as XX-XXXXXXX while typing */
export const formatEin = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
};
