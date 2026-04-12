import { useState } from 'react';
import { useApplication } from '@/context/ApplicationContext';
import { PreQualificationData } from '@/types/application';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

const PreQualification = ({ onQualified }: { onQualified: () => void }) => {
  const { data, updateData } = useApplication();
  const pq = data.preQualification;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState<string | null>(null);

  const update = (fields: Partial<PreQualificationData>) => {
    updateData('preQualification', fields);
    setBlocked(null);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!pq.location) e.location = 'Please select a location.';
    if (pq.location === 'International') {
      setBlocked('We currently only support US and Canada-based merchants.');
      return false;
    }

    if (pq.monthlyVolume === '' || Number(pq.monthlyVolume) < 10000) {
      setBlocked('Monthly processing volume must be at least $10,000 to proceed.');
      return false;
    }

    if (pq.hasBusinessBankAccount !== true) {
      setBlocked('A business bank account is required for payment processing.');
      return false;
    }

    if (!pq.hasPhotoId || !pq.hasBankStatement || !pq.hasSsnEin) {
      e.docs = 'All documentation items must be confirmed.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onQualified();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Quick Qualify</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Let's make sure you're eligible before starting the full application.
          </p>
        </div>

        <div className="wizard-card space-y-6">
          {blocked && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20"
            >
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{blocked}</p>
            </motion.div>
          )}

          {/* Location */}
          <div>
            <label className="field-label">Where is your business located?</label>
            <select
              className="field-input"
              value={pq.location}
              onChange={(e) => update({ location: e.target.value })}
            >
              <option value="">Select location...</option>
              <option value="US">United States</option>
              <option value="Canada">Canada</option>
              <option value="International">International</option>
            </select>
            {errors.location && <p className="field-error">{errors.location}</p>}
          </div>

          {/* Monthly Volume */}
          <div>
            <label className="field-label">Estimated Monthly Processing Volume</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                className="field-input pl-7"
                placeholder="25,000"
                value={pq.monthlyVolume}
                onChange={(e) =>
                  update({ monthlyVolume: e.target.value ? Number(e.target.value) : '' })
                }
              />
            </div>
          </div>

          {/* Business Bank Account */}
          <div>
            <label className="field-label">Do you have a business bank account?</label>
            <div className="flex gap-3 mt-1">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => update({ hasBusinessBankAccount: val })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                    pq.hasBusinessBankAccount === val
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-secondary-foreground border-border hover:border-primary/30'
                  }`}
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          {/* Documentation */}
          <div>
            <label className="field-label">Available Documentation</label>
            <p className="text-xs text-muted-foreground mb-3">All items are required to proceed.</p>
            <div className="space-y-2.5">
              {[
                { key: 'hasPhotoId' as const, label: 'Government-Issued Photo ID' },
                { key: 'hasBankStatement' as const, label: 'Bank Statement or Voided Check' },
                { key: 'hasSsnEin' as const, label: 'SSN or EIN Documentation' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    pq[key]
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border hover:border-primary/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={pq[key]}
                    onChange={(e) => update({ [key]: e.target.checked } as any)}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">{label}</span>
                  {pq[key] && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                </label>
              ))}
            </div>
            {errors.docs && <p className="field-error mt-2">{errors.docs}</p>}
          </div>

          <button onClick={handleSubmit} className="btn-primary w-full">
            Check Eligibility
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PreQualification;
