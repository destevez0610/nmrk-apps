import { useState } from 'react';
import { useApplication } from '@/context/ApplicationContext';
import { OwnerData, US_STATES, CANADIAN_PROVINCES } from '@/types/application';
import { formatPhone } from '@/lib/formatPhone';
import { formatSsn } from '@/lib/formatSsn';
import { formatZip } from '@/lib/formatZip';
import { scrollToFirstError } from '@/lib/scrollToError';
import PrefilledBadge from '@/components/PrefilledBadge';
import { Plus, Trash2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const TITLE_OPTIONS = ['CEO', 'CFO', 'COO', 'CTO', 'President', 'Vice President', 'Managing Member', 'Partner', 'Owner', 'Director', 'Secretary', 'Treasurer'];

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

/** Get max DOB date (must be 18+) */
const getMaxDob = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
};

const OwnershipPrincipals = ({ onNext, onPrev }: Props) => {
  const { data, setData, preFilledFields, setPreFilledFields } = useApplication();
  const owners = data.owners;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openCalendarId, setOpenCalendarId] = useState<string | null>(null);
  const [otherTitleIds, setOtherTitleIds] = useState<Set<string>>(new Set());
  const states = data.preQualification.location === 'Canada' ? CANADIAN_PROVINCES : US_STATES;

  const pf = (idx: number, key: string) => {
    const fieldKey = `owner.${idx}.${key}`;
    if (preFilledFields.has(fieldKey)) return 'field-prefilled';
    return '';
  };

  const clearPf = (idx: number, key: string) => {
    const fieldKey = `owner.${idx}.${key}`;
    if (preFilledFields.has(fieldKey)) {
      setPreFilledFields((prev) => { const n = new Set(prev); n.delete(fieldKey); return n; });
    }
  };

  const totalOwnership = owners.reduce((sum, o) => sum + (Number(o.ownershipPercent) || 0), 0);
  const maxDob = getMaxDob();

  const updateOwner = (id: string, fields: Partial<OwnerData>) => {
    setData((prev) => ({
      ...prev,
      owners: prev.owners.map((o) => (o.id === id ? { ...o, ...fields } : o)),
    }));
  };

  const addOwner = () => {
    setData((prev) => ({
      ...prev,
      owners: [
        ...prev.owners,
        {
          id: crypto.randomUUID(),
          firstName: '', lastName: '', dob: '', ssn: '',
          streetAddress: '', city: '', state: '', zip: '',
          ownershipPercent: '', title: '', email: '', phone: '',
        },
      ],
    }));
  };

  const removeOwner = (id: string) => {
    if (owners.length <= 1) return;
    setData((prev) => ({ ...prev, owners: prev.owners.filter((o) => o.id !== id) }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    owners.forEach((o, i) => {
      if (!o.firstName.trim()) e[`${i}.firstName`] = 'Required';
      if (!o.lastName.trim()) e[`${i}.lastName`] = 'Required';
      if (!o.dob) {
        e[`${i}.dob`] = 'Required';
      } else if (o.dob > maxDob) {
        e[`${i}.dob`] = 'Must be at least 18 years old';
      }
      if (!o.ssn || !/^\d{9}$/.test(o.ssn.replace(/\D/g, ''))) e[`${i}.ssn`] = 'Valid 9-digit SSN required';
      if (!o.streetAddress.trim()) e[`${i}.streetAddress`] = 'Required';
      if (!o.city.trim()) e[`${i}.city`] = 'Required';
      if (!o.state) e[`${i}.state`] = 'Required';
      if (!o.zip) e[`${i}.zip`] = 'Required';
      if (!o.ownershipPercent || Number(o.ownershipPercent) <= 0) e[`${i}.ownership`] = 'Required';
      if (!o.title.trim()) e[`${i}.title`] = 'Required';
    });
    if (totalOwnership !== 100) e.total = 'Total ownership must equal 100%';
    setErrors(e);
    if (Object.keys(e).length > 0) scrollToFirstError();
    return Object.keys(e).length === 0;
  };

  return (
    <div className="wizard-card space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Ownership & Principals</h2>
          <p className="text-sm text-muted-foreground mt-1">All owners with ≥25% stake must be listed</p>
        </div>
        <div className={`text-sm font-semibold px-3 py-1 rounded-full ${totalOwnership === 100 ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'}`}>
          {totalOwnership}% / 100%
        </div>
      </div>

      {errors.total && <p className="field-error">{errors.total}</p>}

      {owners.map((owner, idx) => (
        <div key={owner.id} className="p-4 rounded-lg border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Owner {idx + 1}</h3>
            {owners.length > 1 && (
              <button type="button" onClick={() => removeOwner(owner.id)} className="text-destructive hover:opacity-70">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="field-label">First Name *{pf(idx, 'firstName') && <PrefilledBadge />}</label>
              <input className={`field-input ${pf(idx, 'firstName')}`} value={owner.firstName} onChange={(e) => { clearPf(idx, 'firstName'); updateOwner(owner.id, { firstName: e.target.value }); }} />
              {errors[`${idx}.firstName`] && <p className="field-error">{errors[`${idx}.firstName`]}</p>}
            </div>
            <div>
              <label className="field-label">Last Name *{pf(idx, 'lastName') && <PrefilledBadge />}</label>
              <input className={`field-input ${pf(idx, 'lastName')}`} value={owner.lastName} onChange={(e) => { clearPf(idx, 'lastName'); updateOwner(owner.id, { lastName: e.target.value }); }} />
              {errors[`${idx}.lastName`] && <p className="field-error">{errors[`${idx}.lastName`]}</p>}
            </div>
            <div>
              <label className="field-label">Title *{pf(idx, 'title') && <PrefilledBadge />}</label>
              <select className={`field-input ${pf(idx, 'title')}`} value={TITLE_OPTIONS.includes(owner.title) ? owner.title : otherTitleIds.has(owner.id) || owner.title ? 'Other' : ''} onChange={(e) => {
                if (e.target.value === 'Other') {
                  setOtherTitleIds((prev) => new Set(prev).add(owner.id));
                  updateOwner(owner.id, { title: '' });
                } else {
                  setOtherTitleIds((prev) => { const s = new Set(prev); s.delete(owner.id); return s; });
                  updateOwner(owner.id, { title: e.target.value });
                }
              }}>
                <option value="">Select...</option>
                {TITLE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                <option value="Other">Other</option>
              </select>
              {(otherTitleIds.has(owner.id) || (!TITLE_OPTIONS.includes(owner.title) && owner.title !== '')) && (
                <input className="field-input mt-2" placeholder="Enter your title" value={owner.title} onChange={(e) => updateOwner(owner.id, { title: e.target.value })} />
              )}
              {errors[`${idx}.title`] && <p className="field-error">{errors[`${idx}.title`]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="field-label">Date of Birth *</label>
              <Popover open={openCalendarId === owner.id} onOpenChange={(open) => setOpenCalendarId(open ? owner.id : null)}>
                <PopoverTrigger asChild>
                  <button type="button" className={cn("field-input flex items-center justify-between text-left w-full", !owner.dob && "text-muted-foreground")}>
                    {owner.dob ? format(new Date(owner.dob + 'T00:00:00'), 'MM/dd/yyyy') : 'mm/dd/yyyy'}
                    <CalendarIcon className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={owner.dob ? new Date(owner.dob + 'T00:00:00') : undefined}
                    onSelect={(date) => { updateOwner(owner.id, { dob: date ? format(date, 'yyyy-MM-dd') : '' }); setOpenCalendarId(null); }}
                    toDate={new Date(maxDob + 'T00:00:00')}
                    fromDate={new Date(1900, 0, 1)}
                    defaultMonth={owner.dob ? new Date(owner.dob + 'T00:00:00') : new Date(maxDob + 'T00:00:00')}
                  />
                </PopoverContent>
              </Popover>
              {errors[`${idx}.dob`] && <p className="field-error">{errors[`${idx}.dob`]}</p>}
            </div>
            <div>
              <label className="field-label">SSN *</label>
              <input className="field-input font-mono" placeholder="XXX-XX-XXXX" maxLength={11}
                value={owner.ssn} onChange={(e) => updateOwner(owner.id, { ssn: formatSsn(e.target.value) })} />
              {errors[`${idx}.ssn`] && <p className="field-error">{errors[`${idx}.ssn`]}</p>}
            </div>
            <div>
              <label className="field-label">Ownership % *{pf(idx, 'ownershipPercent') && <PrefilledBadge />}</label>
              <input type="number" className={`field-input ${pf(idx, 'ownershipPercent')}`} min={1} max={100}
                value={owner.ownershipPercent} onChange={(e) => updateOwner(owner.id, { ownershipPercent: e.target.value ? Number(e.target.value) : '' })} />
              {errors[`${idx}.ownership`] && <p className="field-error">{errors[`${idx}.ownership`]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Email{pf(idx, 'email') && <PrefilledBadge />}</label>
              <input type="email" className={`field-input ${pf(idx, 'email')}`} value={owner.email} onChange={(e) => { clearPf(idx, 'email'); updateOwner(owner.id, { email: e.target.value }); }} />
            </div>
            <div>
              <label className="field-label">Phone{pf(idx, 'phone') && <PrefilledBadge />}</label>
              <input className={`field-input ${pf(idx, 'phone')}`} placeholder="(555) 123-4567" value={owner.phone} onChange={(e) => { clearPf(idx, 'phone'); updateOwner(owner.id, { phone: formatPhone(e.target.value) }); }} />
            </div>
          </div>

          <div>
            <label className="field-label">Home Address *</label>
            <input className="field-input mb-3" placeholder="Street Address" value={owner.streetAddress}
              onChange={(e) => updateOwner(owner.id, { streetAddress: e.target.value })} />
            {errors[`${idx}.streetAddress`] && <p className="field-error -mt-2 mb-2">{errors[`${idx}.streetAddress`]}</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <input className="field-input" placeholder="City" value={owner.city} onChange={(e) => updateOwner(owner.id, { city: e.target.value })} />
                {errors[`${idx}.city`] && <p className="field-error">{errors[`${idx}.city`]}</p>}
              </div>
              <div>
                <select className="field-input" value={owner.state} onChange={(e) => updateOwner(owner.id, { state: e.target.value })}>
                  <option value="">State</option>
                  {states.map((s) => <option key={s}>{s}</option>)}
                </select>
                {errors[`${idx}.state`] && <p className="field-error">{errors[`${idx}.state`]}</p>}
              </div>
              <div>
                <input className="field-input" placeholder="ZIP" maxLength={10} value={owner.zip} onChange={(e) => updateOwner(owner.id, { zip: formatZip(e.target.value) })} />
                {errors[`${idx}.zip`] && <p className="field-error">{errors[`${idx}.zip`]}</p>}
              </div>
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={addOwner} className="btn-secondary flex items-center gap-2 text-sm">
        <Plus className="w-4 h-4" /> Add Another Owner
      </button>

      <div className="flex justify-between pt-4">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={() => validate() && onNext()} className="btn-primary">Continue</button>
      </div>
    </div>
  );
};

export default OwnershipPrincipals;
