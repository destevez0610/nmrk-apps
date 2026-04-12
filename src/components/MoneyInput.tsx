import { useState, useEffect } from 'react';
import { formatMoney, parseMoney, numberToMoney } from '@/lib/formatMoney';

interface MoneyInputProps {
  value: number | '';
  onChange: (val: number | '') => void;
  placeholder?: string;
  className?: string;
}

const MoneyInput = ({ value, onChange, placeholder, className }: MoneyInputProps) => {
  const [display, setDisplay] = useState(numberToMoney(value));

  useEffect(() => {
    // Sync external value changes
    const current = parseMoney(display);
    if (current !== value) {
      setDisplay(numberToMoney(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatMoney(raw);
    setDisplay(formatted);
    onChange(parseMoney(formatted));
  };

  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
      <input
        type="text"
        inputMode="numeric"
        className={`field-input pl-7 ${className || ''}`}
        placeholder={placeholder}
        value={display}
        onChange={handleChange}
      />
    </div>
  );
};

export default MoneyInput;
