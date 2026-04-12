import { useState } from 'react';
import { useApplication } from '@/context/ApplicationContext';

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
    setErrors(e);
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
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input type="number" className="field-input pl-7"
              value={pp.monthlyVolume}
              onChange={(e) => update({ monthlyVolume: e.target.value ? Number(e.target.value) : '' })} />
          </div>
          {errors.monthlyVolume && <p className="field-error">{errors.monthlyVolume}</p>}
        </div>
        <div>
          <label className="field-label">Average Ticket *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input type="number" className="field-input pl-7"
              value={pp.averageTicket}
              onChange={(e) => update({ averageTicket: e.target.value ? Number(e.target.value) : '' })} />
          </div>
          {errors.averageTicket && <p className="field-error">{errors.averageTicket}</p>}
        </div>
        <div>
          <label className="field-label">High Ticket *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input type="number" className="field-input pl-7"
              value={pp.highTicket}
              onChange={(e) => update({ highTicket: e.target.value ? Number(e.target.value) : '' })} />
          </div>
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
            <input type="number" className="field-input mt-1" min={0} max={100}
              value={pp.cardPresentPercent}
              onChange={(e) => handleCardSplit('cardPresentPercent', Number(e.target.value))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Card-Not-Present %</label>
            <input type="number" className="field-input mt-1" min={0} max={100}
              value={pp.cardNotPresentPercent}
              onChange={(e) => handleCardSplit('cardNotPresentPercent', Number(e.target.value))} />
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
          <label className="field-label">Refund Policy URL *</label>
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
              <input type="number" className="field-input mt-1" value={pp.ecommercePercent}
                onChange={(e) => update({ ecommercePercent: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Mail Order %</label>
              <input type="number" className="field-input mt-1" value={pp.mailOrderPercent}
                onChange={(e) => update({ mailOrderPercent: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Phone Order %</label>
              <input type="number" className="field-input mt-1" value={pp.phoneOrderPercent}
                onChange={(e) => update({ phoneOrderPercent: Number(e.target.value) })} />
            </div>
          </div>
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
