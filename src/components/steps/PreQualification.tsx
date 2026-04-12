import { useState } from 'react';
import { useApplication } from '@/context/ApplicationContext';
import { PreQualificationData, PreQualPrincipal } from '@/types/application';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, Plus, Trash2, UserPlus, Users, ClipboardCheck } from 'lucide-react';

const BEST_TIMES = ['Morning (8am–12pm)', 'Afternoon (12pm–5pm)', 'Evening (5pm–8pm)', 'Anytime'];

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 250 : -250, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -250 : 250, opacity: 0 }),
};

const PreQualification = ({ onQualified }: { onQualified: () => void }) => {
  const { data, updateData, setData } = useApplication();
  const pq = data.preQualification;
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState<string | null>(null);
  const [notQualifiedMsg, setNotQualifiedMsg] = useState<string | null>(null);

  const principals = pq.principals;
  const totalOwnership = principals.reduce((s, p) => s + (Number(p.ownershipPercent) || 0), 0);
  const needsMore = totalOwnership < 51;

  const update = (fields: Partial<PreQualificationData>) => {
    updateData('preQualification', fields);
    setBlocked(null);
    setNotQualifiedMsg(null);
  };

  const updatePrincipal = (id: string, fields: Partial<PreQualPrincipal>) => {
    setData((prev) => ({
      ...prev,
      preQualification: {
        ...prev.preQualification,
        principals: prev.preQualification.principals.map((p) =>
          p.id === id ? { ...p, ...fields } : p
        ),
      },
    }));
  };

  const addPrincipal = () => {
    setData((prev) => ({
      ...prev,
      preQualification: {
        ...prev.preQualification,
        principals: [
          ...prev.preQualification.principals,
          {
            id: crypto.randomUUID(),
            firstName: '', lastName: '', email: '', phone: '',
            title: '', ownershipPercent: '', bestTimeToContact: '',
          },
        ],
      },
    }));
  };

  const removePrincipal = (id: string) => {
    if (principals.length <= 1) return;
    setData((prev) => ({
      ...prev,
      preQualification: {
        ...prev.preQualification,
        principals: prev.preQualification.principals.filter((p) => p.id !== id),
      },
    }));
  };

  const goTo = (s: number) => {
    setDir(s > step ? 1 : -1);
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 0 validation: primary principal info
  const validateStep0 = () => {
    const e: Record<string, string> = {};
    const p = principals[0];
    if (!p.firstName.trim()) e['0.firstName'] = 'Required';
    if (!p.lastName.trim()) e['0.lastName'] = 'Required';
    if (!p.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) e['0.email'] = 'Valid email required';
    if (!p.phone.trim()) e['0.phone'] = 'Required';
    if (!p.title.trim()) e['0.title'] = 'Required';
    if (!p.ownershipPercent || Number(p.ownershipPercent) <= 0 || Number(p.ownershipPercent) > 100)
      e['0.ownership'] = 'Enter a valid percentage (1-100)';
    if (!p.bestTimeToContact) e['0.bestTime'] = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Step 1 validation: additional principals
  const validateStep1 = () => {
    const e: Record<string, string> = {};
    principals.forEach((p, i) => {
      if (i === 0) return; // already validated
      if (!p.firstName.trim()) e[`${i}.firstName`] = 'Required';
      if (!p.lastName.trim()) e[`${i}.lastName`] = 'Required';
      if (!p.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) e[`${i}.email`] = 'Valid email required';
      if (!p.phone.trim()) e[`${i}.phone`] = 'Required';
      if (!p.title.trim()) e[`${i}.title`] = 'Required';
      if (!p.ownershipPercent || Number(p.ownershipPercent) <= 0) e[`${i}.ownership`] = 'Required';
    });
    if (totalOwnership < 51) e.total = 'Combined ownership must be at least 51%';
    if (totalOwnership > 100) e.total = 'Combined ownership cannot exceed 100%';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Step 2 validation: eligibility
  const validateEligibility = (): boolean => {
    const e: Record<string, string> = {};

    if (!pq.location) e.location = 'Please select a location.';
    if (pq.location === 'International') {
      setNotQualifiedMsg('We currently only support US and Canada-based merchants. You may still be eligible — please reach out to support@noomerik.com for more information.');
      return false;
    }

    if (pq.monthlyVolume === '' || Number(pq.monthlyVolume) < 10000) {
      setNotQualifiedMsg('Monthly processing volume must be at least $10,000 to proceed through our standard application. However, you may still qualify — please contact support@noomerik.com and we\'ll work with you to find the best solution.');
      return false;
    }

    if (pq.hasBusinessBankAccount !== true) {
      setNotQualifiedMsg('A business bank account is typically required for payment processing. If you\'re in the process of setting one up, please reach out to support@noomerik.com and we can discuss your options.');
      return false;
    }

    if (!pq.hasPhotoId || !pq.hasBankStatement || !pq.hasSsnEin) {
      e.docs = 'All documentation items must be confirmed.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStep0Next = () => {
    if (!validateStep0()) return;
    const primary = principals[0];
    if (Number(primary.ownershipPercent) >= 51) {
      // Skip additional principals, go to eligibility
      goTo(2);
    } else {
      goTo(1);
    }
  };

  const handleStep1Next = () => {
    if (!validateStep1()) return;
    goTo(2);
  };

  const handleSubmit = () => {
    if (validateEligibility()) onQualified();
  };

  const renderPrincipalFields = (p: PreQualPrincipal, idx: number, removable: boolean) => (
    <div key={p.id} className="p-4 rounded-lg border border-border space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {idx === 0 ? 'Primary Applicant' : `Additional Principal ${idx}`}
        </h3>
        {removable && (
          <button type="button" onClick={() => removePrincipal(p.id)} className="text-destructive hover:opacity-70">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="field-label">First Name *</label>
          <input className="field-input" value={p.firstName} onChange={(e) => updatePrincipal(p.id, { firstName: e.target.value })} />
          {errors[`${idx}.firstName`] && <p className="field-error">{errors[`${idx}.firstName`]}</p>}
        </div>
        <div>
          <label className="field-label">Last Name *</label>
          <input className="field-input" value={p.lastName} onChange={(e) => updatePrincipal(p.id, { lastName: e.target.value })} />
          {errors[`${idx}.lastName`] && <p className="field-error">{errors[`${idx}.lastName`]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="field-label">Email *</label>
          <input type="email" className="field-input" value={p.email} onChange={(e) => updatePrincipal(p.id, { email: e.target.value })} />
          {errors[`${idx}.email`] && <p className="field-error">{errors[`${idx}.email`]}</p>}
        </div>
        <div>
          <label className="field-label">Phone *</label>
          <input className="field-input" placeholder="(555) 123-4567" value={p.phone} onChange={(e) => updatePrincipal(p.id, { phone: e.target.value })} />
          {errors[`${idx}.phone`] && <p className="field-error">{errors[`${idx}.phone`]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="field-label">Title *</label>
          <input className="field-input" placeholder="CEO, Owner, Partner..." value={p.title} onChange={(e) => updatePrincipal(p.id, { title: e.target.value })} />
          {errors[`${idx}.title`] && <p className="field-error">{errors[`${idx}.title`]}</p>}
        </div>
        <div>
          <label className="field-label">Ownership % *</label>
          <input type="number" className="field-input" min={1} max={100} value={p.ownershipPercent}
            onChange={(e) => updatePrincipal(p.id, { ownershipPercent: e.target.value ? Number(e.target.value) : '' })} />
          {errors[`${idx}.ownership`] && <p className="field-error">{errors[`${idx}.ownership`]}</p>}
        </div>
        <div>
          <label className="field-label">Best Time to Contact *</label>
          <select className="field-input" value={p.bestTimeToContact} onChange={(e) => updatePrincipal(p.id, { bestTimeToContact: e.target.value })}>
            <option value="">Select...</option>
            {BEST_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors[`${idx}.bestTime`] && <p className="field-error">{errors[`${idx}.bestTime`]}</p>}
        </div>
      </div>
    </div>
  );

  const stepIndicators = [
    { icon: UserPlus, label: 'Your Info' },
    { icon: Users, label: 'Principals' },
    { icon: ClipboardCheck, label: 'Eligibility' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Pre-Qualification</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Let's collect some information and check your eligibility.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {stepIndicators.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === step ? 'bg-primary text-primary-foreground' :
                i < step ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'
              }`}>
                <s.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
                {i < step && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              {i < stepIndicators.length - 1 && (
                <div className={`w-8 h-0.5 rounded ${i < step ? 'bg-accent' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* STEP 0: Primary Contact Info */}
            {step === 0 && (
              <div className="wizard-card space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Tell us about yourself</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    We need your contact details and ownership information to get started.
                  </p>
                </div>

                {renderPrincipalFields(principals[0], 0, false)}

                <button onClick={handleStep0Next} className="btn-primary w-full">
                  Continue
                </button>
              </div>
            )}

            {/* STEP 1: Additional Principals */}
            {step === 1 && (
              <div className="wizard-card space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Additional Principals</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Since your ownership is below 51%, you must add additional principals so that combined ownership reaches at least 51%.
                  </p>
                </div>

                <div className={`text-sm font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-2 ${
                  totalOwnership >= 51 && totalOwnership <= 100
                    ? 'bg-accent/10 text-accent'
                    : 'bg-warning/10 text-warning'
                }`}>
                  Combined Ownership: {totalOwnership}%
                  {totalOwnership >= 51 && totalOwnership <= 100 && <CheckCircle2 className="w-4 h-4" />}
                </div>

                {errors.total && <p className="field-error">{errors.total}</p>}

                {/* Show primary (read-only summary) */}
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm text-foreground font-medium">
                    {principals[0].firstName} {principals[0].lastName} — {principals[0].title} ({principals[0].ownershipPercent}%)
                  </p>
                </div>

                {/* Additional principals */}
                {principals.slice(1).map((p, i) => renderPrincipalFields(p, i + 1, true))}

                <button type="button" onClick={addPrincipal} className="btn-secondary flex items-center gap-2 text-sm w-full justify-center">
                  <Plus className="w-4 h-4" /> Add Another Principal
                </button>

                <div className="flex justify-between pt-2">
                  <button onClick={() => goTo(0)} className="btn-secondary">Back</button>
                  <button onClick={handleStep1Next} className="btn-primary">Continue</button>
                </div>
              </div>
            )}

            {/* STEP 2: Eligibility Check */}
            {step === 2 && (
              <div className="wizard-card space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Check Eligibility</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    A few more questions to verify you're eligible for our standard application.
                  </p>
                </div>

                {notQualifiedMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-col gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">{notQualifiedMsg}</p>
                    </div>
                    <a
                      href="mailto:support@noomerik.com"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Contact support@noomerik.com →
                    </a>
                  </motion.div>
                )}

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

                <div className="flex justify-between pt-2">
                  <button onClick={() => goTo(needsMore || principals.length > 1 ? 1 : 0)} className="btn-secondary">Back</button>
                  <button onClick={handleSubmit} className="btn-primary">Check Eligibility</button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PreQualification;
