const ReadOnlyField = ({ label, value, optional }: { label: string; value: string | number | undefined | null; optional?: boolean }) => (
  <div>
    <label className="field-label">
      {label}
      {optional && <span className="text-xs font-normal text-muted-foreground ml-1">(Optional)</span>}
    </label>
    <div className="field-input bg-secondary/50 cursor-default text-foreground text-sm">
      {value || '—'}
    </div>
  </div>
);

export default ReadOnlyField;
