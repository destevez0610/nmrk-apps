/** Formats a numeric string with commas as user types. Returns display string. */
export const formatMoney = (value: string): string => {
  // Strip everything except digits and decimal
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  const intPart = parts[0] || '';
  // Add commas
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (parts.length > 1) {
    return `${withCommas}.${parts[1].slice(0, 2)}`;
  }
  return withCommas;
};

/** Parse a formatted money string back to a number or '' */
export const parseMoney = (display: string): number | '' => {
  const cleaned = display.replace(/[^0-9.]/g, '');
  if (!cleaned) return '';
  const num = parseFloat(cleaned);
  return isNaN(num) ? '' : num;
};

/** Format a number to display string */
export const numberToMoney = (val: number | ''): string => {
  if (val === '' || val === 0) return '';
  return val.toLocaleString('en-US');
};
