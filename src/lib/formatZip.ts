/** Format ZIP code: allows 5 digits or 5+4 (XXXXX or XXXXX-XXXX) */
export const formatZip = (value: string): string => {
  const digits = value.replace(/[^\d]/g, '').slice(0, 9);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};
