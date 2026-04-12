import { useState } from 'react';
import { useApplication } from '@/context/ApplicationContext';
import MoneyInput from '@/components/MoneyInput';
import { scrollToFirstError } from '@/lib/scrollToError';

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const ProcessingProfile = ({ onNext, onPrev }: Props) => {
  const { data, updateData } = useApplication();
  const pp = data.processingProfile;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (fields: Partial<typeof pp>) => updateData('processingProfile', fields);

  const handleCardSplit = (field: 'cardPresentPercent' | 'cardNotPresentPercent', val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    if (field === 'cardPresentPercent') {
      update({ cardPresentPercent: clamped, cardNotPresentPercent: 100 - clamped });
    } else {
      update({ cardNotPresentPercent: clamped, cardPresentPercent: 100 - clamped });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!pp.monthlyVolume) e.monthlyVolume = 'Required';
    if (!pp.averageTicket) e.averageTicket = 'Required';
    if (!pp.highTicket) e.highTicket = 'Required';
    if (pp.averageTicket && pp.highTicket && Number(pp.highTicket) < Number(pp.averageTicket)) {
      e.highTicket = 'Must be ≥ Average Ticket';
    }
    if (pp.cardPresentPercent + pp.cardNotPresentPercent !== 100) {
      e.split = 'Must total 100%';
    }
    if (pp.cardNotPresentPercent > 50 && !pp.refundPolicyUrl.trim()) {
      e.refundPolicyUrl = 'Required when Card-Not-Present > 50%';
    }
    if (pp.cardNotPresentPercent > 0) {
      const cnpTotal = (pp.ecommercePercent || 0) + (pp.mailOrderPercent || 0) + (pp.phoneOrderPercent || 0);
      if (cnpTotal !== 100) e.cnpBreakdown = 'E-Commerce + Mail Order + Phone Order must equal 100%';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) scrollToFirstError();
    return Object.keys(e).length === 0;
  };

  return (
    <div className="wizard-card space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Processing Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">Volume and transaction details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="field-label">Monthly Volume *</label>
          <MoneyInput value={pp.monthlyVolume} onChange={(v) => update({ monthlyVolume: v })} placeholder="25,000" />
          {errors.monthlyVolume && <p className="field-error">{errors.monthlyVolume}</p>}
        </div>
        <div>
          <label className="field-label">Average Ticket *</label>
          <MoneyInput value={pp.averageTicket} onChange={(v) => update({ averageTicket: v })} placeholder="150" />
          {errors.averageTicket && <p className="field-error">{errors.averageTicket}</p>}
        </div>
        <div>
          <label className="field-label">High Ticket *</label>
          <MoneyInput value={pp.highTicket} onChange={(v) => update({ highTicket: v })} placeholder="5,000" />
          {errors.highTicket && <p className="field-error">{errors.highTicket}</p>}
        </div>
      </div>

      {/* Card Present / Not Present Split */}
      <div>
        <label className="field-label">Transaction Split *</label>
        <p className="text-xs text-muted-foreground mb-3">Card-Present vs Card-Not-Present (must total 100%)</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Card-Present %</label>
            <input type="text" inputMode="numeric" className="field-input mt-1"
              value={pp.cardPresentPercent || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                handleCardSplit('cardPresentPercent', val === '' ? 0 : Number(val));
              }} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Card-Not-Present %</label>
            <input type="text" inputMode="numeric" className="field-input mt-1"
              value={pp.cardNotPresentPercent || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                handleCardSplit('cardNotPresentPercent', val === '' ? 0 : Number(val));
              }} />
          </div>
        </div>
        {errors.split && <p className="field-error">{errors.split}</p>}

        {/* Visual bar */}
        <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden flex">
          <div className="bg-primary transition-all duration-300" style={{ width: `${pp.cardPresentPercent}%` }} />
          <div className="bg-accent transition-all duration-300" style={{ width: `${pp.cardNotPresentPercent}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Present: {pp.cardPresentPercent}%</span>
          <span>Not-Present: {pp.cardNotPresentPercent}%</span>
        </div>
      </div>

      {pp.cardNotPresentPercent > 50 && (
        <div>
          <label className="field-label">Refund Policy URL * <span className="text-xs font-normal text-muted-foreground">(Required when CNP &gt; 50%)</span></label>
          <input className="field-input" placeholder="https://yoursite.com/refund-policy"
            value={pp.refundPolicyUrl}
            onChange={(e) => update({ refundPolicyUrl: e.target.value })} />
          {errors.refundPolicyUrl && <p className="field-error">{errors.refundPolicyUrl}</p>}
        </div>
      )}

      {/* CNP Breakdown */}
      {pp.cardNotPresentPercent > 0 && (
        <div>
          <label className="field-label">Card-Not-Present Breakdown</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">E-Commerce %</label>
              <input type="text" inputMode="numeric" className="field-input mt-1" value={pp.ecommercePercent || ''}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); update({ ecommercePercent: v === '' ? 0 : Number(v) }); }} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Mail Order %</label>
              <input type="text" inputMode="numeric" className="field-input mt-1" value={pp.mailOrderPercent || ''}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); update({ mailOrderPercent: v === '' ? 0 : Number(v) }); }} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Phone Order %</label>
              <input type="text" inputMode="numeric" className="field-input mt-1" value={pp.phoneOrderPercent || ''}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); update({ phoneOrderPercent: v === '' ? 0 : Number(v) }); }} />
            </div>
          </div>
          {errors.cnpBreakdown && <p className="field-error">{errors.cnpBreakdown}</p>}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={() => validate() && onNext()} className="btn-primary">Continue</button>
      </div>
    </div>
  );
};

export default ProcessingProfile;
