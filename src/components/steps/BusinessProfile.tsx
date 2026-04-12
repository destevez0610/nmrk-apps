import { useState } from 'react';
import { useApplication } from '@/context/ApplicationContext';
import { BUSINESS_STRUCTURES, INDUSTRY_TYPES, US_STATES, CANADIAN_PROVINCES } from '@/types/application';
import { formatPhone } from '@/lib/formatPhone';
import { formatEin } from '@/lib/formatEin';
import { formatSsn } from '@/lib/formatSsn';
import { formatZip } from '@/lib/formatZip';
import { scrollToFirstError } from '@/lib/scrollToError';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import PrefilledBadge from '@/components/PrefilledBadge';

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const BusinessProfile = ({ onNext, onPrev }: Props) => {
  const { data, updateData, preFilledFields, setPreFilledFields } = useApplication();
  const bp = data.businessProfile;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calendarOpen, setCalendarOpen] = useState(false);

  const update = (fields: Partial<typeof bp>) => updateData('businessProfile', fields);
  const isSoleProp = bp.businessStructure === 'Sole Proprietorship';
  const states = data.preQualification.location === 'Canada' ? CANADIAN_PROVINCES : US_STATES;

  const pf = (key: string) => {
    const fieldKey = `businessProfile.${key}`;
    if (preFilledFields.has(fieldKey)) return 'field-prefilled';
    return '';
  };

  const clearPf = (key: string) => {
    const fieldKey = `businessProfile.${key}`;
    if (preFilledFields.has(fieldKey)) {
      setPreFilledFields((prev) => { const n = new Set(prev); n.delete(fieldKey); return n; });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!bp.legalName.trim()) e.legalName = 'Required';
    if (!bp.businessStructure) e.businessStructure = 'Required';
    if (!isSoleProp && (!bp.ein || !/^\d{9}$/.test(bp.ein.replace(/\D/g, '')))) e.ein = 'Valid 9-digit EIN required';
    if (isSoleProp && (!bp.ssn || !/^\d{9}$/.test(bp.ssn.replace(/\D/g, '')))) e.ssn = 'Valid 9-digit SSN required';
    if (!bp.streetAddress.trim()) e.streetAddress = 'Required';
    if (!bp.city.trim()) e.city = 'Required';
    if (!bp.state) e.state = 'Required';
    if (!bp.zip || !/^\d{5}(-\d{4})?$/.test(bp.zip)) e.zip = 'Valid ZIP required';
    if (!bp.phoneNumber.trim()) e.phoneNumber = 'Required';
    if (!bp.industryType) e.industryType = 'Required';
    setErrors(e);
    if (Object.keys(e).length > 0) scrollToFirstError();
    return Object.keys(e).length === 0;
  };

  return (
    <div className="wizard-card space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Business Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">Entity and contact information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Legal Business Name *{pf('legalName') && <PrefilledBadge />}</label>
          <input className={`field-input ${pf('legalName')}`} value={bp.legalName} onChange={(e) => { clearPf('legalName'); update({ legalName: e.target.value }); }} />
          {errors.legalName && <p className="field-error">{errors.legalName}</p>}
        </div>
        <div>
          <label className="field-label">DBA (Doing Business As) <span className="text-xs font-normal text-muted-foreground">(Optional)</span></label>
          <input className="field-input" value={bp.dba} onChange={(e) => update({ dba: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Business Structure *</label>
          <select className="field-input" value={bp.businessStructure} onChange={(e) => update({ businessStructure: e.target.value })}>
            <option value="">Select...</option>
            {BUSINESS_STRUCTURES.map((s) => <option key={s}>{s}</option>)}
          </select>
          {errors.businessStructure && <p className="field-error">{errors.businessStructure}</p>}
        </div>
        <div>
          {isSoleProp ? (
            <>
              <label className="field-label">Social Security Number *</label>
              <input className="field-input font-mono" placeholder="XXX-XX-XXXX" maxLength={11}
                value={bp.ssn} onChange={(e) => update({ ssn: formatSsn(e.target.value) })} />
              {errors.ssn && <p className="field-error">{errors.ssn}</p>}
            </>
          ) : (
            <>
              <label className="field-label">EIN (Employer ID) *</label>
              <input className="field-input font-mono" placeholder="XX-XXXXXXX" maxLength={10}
                value={bp.ein} onChange={(e) => update({ ein: formatEin(e.target.value) })} />
              {errors.ein && <p className="field-error">{errors.ein}</p>}
            </>
          )}
        </div>
      </div>

      <div>
        <label className="field-label">Industry Type *</label>
        <select className="field-input" value={bp.industryType} onChange={(e) => update({ industryType: e.target.value })}>
          <option value="">Select...</option>
          {INDUSTRY_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        {errors.industryType && <p className="field-error">{errors.industryType}</p>}
      </div>

      <div>
        <label className="field-label">Physical Business Address *</label>
        <input className="field-input mb-3" placeholder="Street Address" value={bp.streetAddress}
          onChange={(e) => update({ streetAddress: e.target.value })} />
        {errors.streetAddress && <p className="field-error -mt-2 mb-2">{errors.streetAddress}</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <input className="field-input" placeholder="City" value={bp.city} onChange={(e) => update({ city: e.target.value })} />
            {errors.city && <p className="field-error">{errors.city}</p>}
          </div>
          <div>
            <select className="field-input" value={bp.state} onChange={(e) => update({ state: e.target.value })}>
              <option value="">State</option>
              {states.map((s) => <option key={s}>{s}</option>)}
            </select>
            {errors.state && <p className="field-error">{errors.state}</p>}
          </div>
          <div>
            <input className="field-input" placeholder="ZIP" maxLength={10} value={bp.zip} onChange={(e) => update({ zip: formatZip(e.target.value) })} />
            {errors.zip && <p className="field-error">{errors.zip}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Business Phone *{pf('phoneNumber') && <PrefilledBadge />}</label>
          <input className={`field-input ${pf('phoneNumber')}`} placeholder="(555) 123-4567" value={bp.phoneNumber} onChange={(e) => { clearPf('phoneNumber'); update({ phoneNumber: formatPhone(e.target.value) }); }} />
          {errors.phoneNumber && <p className="field-error">{errors.phoneNumber}</p>}
        </div>
        <div>
          <label className="field-label">Website URL <span className="text-xs font-normal text-muted-foreground">(Optional)</span></label>
          <input className="field-input" placeholder="https://" value={bp.websiteUrl} onChange={(e) => update({ websiteUrl: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="field-label">Business Start Date <span className="text-xs font-normal text-muted-foreground">(Optional)</span></label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={cn("field-input flex items-center justify-between text-left", !bp.businessStartDate && "text-muted-foreground")}>
              {bp.businessStartDate ? format(new Date(bp.businessStartDate + 'T00:00:00'), 'MM/dd/yyyy') : 'mm/dd/yyyy'}
              <CalendarIcon className="h-4 w-4 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={bp.businessStartDate ? new Date(bp.businessStartDate + 'T00:00:00') : undefined}
              onSelect={(date) => { update({ businessStartDate: date ? format(date, 'yyyy-MM-dd') : '' }); setCalendarOpen(false); }}
              toDate={new Date()}
              fromDate={new Date(1900, 0, 1)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={() => validate() && onNext()} className="btn-primary">Continue</button>
      </div>
    </div>
  );
};

export default BusinessProfile;
