import { useState, useCallback } from 'react';
import { useApplication } from '@/context/ApplicationContext';
import { Upload, X } from 'lucide-react';

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const BankingSettlement = ({ onNext, onPrev }: Props) => {
  const { data, updateData } = useApplication();
  const bk = data.banking;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (fields: Partial<typeof bk>) => updateData('banking', fields);

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) update({ voidedCheckFile: file });
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!bk.bankName.trim()) e.bankName = 'Required';
    if (!bk.routingNumber || !/^\d{9}$/.test(bk.routingNumber)) e.routingNumber = 'Valid 9-digit routing number required';
    if (!bk.accountNumber.trim()) e.accountNumber = 'Required';
    if (!bk.voidedCheckFile) e.file = 'Voided check or bank letter required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="wizard-card space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Banking & Settlement</h2>
        <p className="text-sm text-muted-foreground mt-1">Where funds will be deposited</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Bank Name *</label>
          <input className="field-input" value={bk.bankName} onChange={(e) => update({ bankName: e.target.value })} />
          {errors.bankName && <p className="field-error">{errors.bankName}</p>}
        </div>
        <div>
          <label className="field-label">Account Type *</label>
          <select className="field-input" value={bk.accountType} onChange={(e) => update({ accountType: e.target.value })}>
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Routing Number *</label>
          <input className="field-input font-mono" maxLength={9} placeholder="9 digits"
            value={bk.routingNumber} onChange={(e) => update({ routingNumber: e.target.value.replace(/\D/g, '') })} />
          {errors.routingNumber && <p className="field-error">{errors.routingNumber}</p>}
        </div>
        <div>
          <label className="field-label">Account Number *</label>
          <input className="field-input font-mono" value={bk.accountNumber}
            onChange={(e) => update({ accountNumber: e.target.value })} />
          {errors.accountNumber && <p className="field-error">{errors.accountNumber}</p>}
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label className="field-label">Voided Check or Bank Letter *</label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 transition-colors cursor-pointer"
          onClick={() => document.getElementById('voided-check-input')?.click()}
        >
          {bk.voidedCheckFile ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-foreground">{bk.voidedCheckFile.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); update({ voidedCheckFile: null }); }}
                className="text-destructive hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
              <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</p>
            </div>
          )}
          <input id="voided-check-input" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => e.target.files?.[0] && update({ voidedCheckFile: e.target.files[0] })} />
        </div>
        {errors.file && <p className="field-error">{errors.file}</p>}
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={() => validate() && onNext()} className="btn-primary">Continue</button>
      </div>
    </div>
  );
};

export default BankingSettlement;
