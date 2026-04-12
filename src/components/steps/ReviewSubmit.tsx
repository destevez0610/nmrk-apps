import { useState, useMemo } from 'react';
import { useApplication } from '@/context/ApplicationContext';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Pencil, FileText } from 'lucide-react';
import SignaturePad from '@/components/SignaturePad';

interface Props {
  onPrev: () => void;
  onGoToStep?: (step: number) => void;
}

/** Truncate long filenames */
const truncateName = (name: string, maxLen = 24): string => {
  if (name.length <= maxLen) return name;
  const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
  const base = name.slice(0, name.length - ext.length);
  const keep = maxLen - ext.length - 3;
  return base.slice(0, Math.max(keep, 6)) + '...' + ext;
};

const isImage = (file: File) => file.type.startsWith('image/');

/** Frosted thumbnail for sensitive docs */
const DocThumbnail = ({ file, frosted = false }: { file: File; frosted?: boolean }) => {
  const previewUrl = useMemo(() => {
    if (isImage(file)) return URL.createObjectURL(file);
    return null;
  }, [file]);

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-secondary w-full">
      <div className="aspect-[4/3] flex items-center justify-center overflow-hidden relative">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name}
            className={`w-full h-full object-cover ${frosted ? 'blur-[6px] brightness-90' : ''}`}
          />
        ) : (
          <FileText className="w-8 h-8 text-muted-foreground" />
        )}
        {frosted && (
          <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px]" />
        )}
      </div>
      <div className="px-2 py-1.5 bg-card border-t border-border">
        <p className="text-[11px] text-foreground truncate" title={file.name}>
          {truncateName(file.name)}
        </p>
      </div>
    </div>
  );
};

const ReviewSubmit = ({ onPrev, onGoToStep }: Props) => {
  const { data, isSubmitted, setIsSubmitted, confirmationId, setConfirmationId, signature, setSignature } = useApplication();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sigError, setSigError] = useState('');
  const bp = data.businessProfile;
  const pp = data.processingProfile;
  const bk = data.banking;
  const docs = data.documents;

  const handleSubmit = async () => {
    if (!signature) {
      setSigError('Please sign before submitting.');
      return;
    }
    setSigError('');
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 3000));
    const id = `MAV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setConfirmationId(id);
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (isSubmitting) {
    return (
      <div className="wizard-card flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-bold text-foreground">Sending to Underwriting...</h2>
        <p className="text-sm text-muted-foreground mt-2">Please wait while we submit your application.</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="wizard-card flex flex-col items-center justify-center py-16"
      >
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Application Submitted!</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-6">Your merchant application has been received.</p>
        <div className="bg-secondary rounded-lg px-6 py-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Confirmation ID</p>
          <p className="text-lg font-mono font-bold text-primary">{confirmationId}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-6 max-w-sm text-center">
          Our underwriting team will review your application within 1-2 business days.
          You'll receive an email with next steps.
        </p>
      </motion.div>
    );
  }

  const Section = ({ title, stepIndex, children }: { title: string; stepIndex: number; children: React.ReactNode }) => (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {onGoToStep && (
          <button
            type="button"
            onClick={() => onGoToStep(stepIndex)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );

  return (
    <div className="wizard-card space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Review & Submit</h2>
        <p className="text-sm text-muted-foreground mt-1">Please review all information before submitting.</p>
      </div>

      <Section title="Business Profile" stepIndex={0}>
        <Field label="Legal Name" value={bp.legalName} />
        <Field label="DBA" value={bp.dba} />
        <Field label="Structure" value={bp.businessStructure} />
        <Field label="Industry" value={bp.industryType} />
        <Field label="Address" value={`${bp.streetAddress}, ${bp.city}, ${bp.state} ${bp.zip}`} />
        <Field label="Phone" value={bp.phoneNumber} />
        <Field label="Website" value={bp.websiteUrl} />
      </Section>

      <Section title="Processing Profile" stepIndex={1}>
        <Field label="Monthly Volume" value={`$${Number(pp.monthlyVolume).toLocaleString()}`} />
        <Field label="Average Ticket" value={`$${Number(pp.averageTicket).toLocaleString()}`} />
        <Field label="High Ticket" value={`$${Number(pp.highTicket).toLocaleString()}`} />
        <Field label="Card Present" value={`${pp.cardPresentPercent}%`} />
        <Field label="Card Not Present" value={`${pp.cardNotPresentPercent}%`} />
        {pp.cardNotPresentPercent > 0 && (
          <>
            <Field label="E-Commerce" value={`${pp.ecommercePercent}%`} />
            <Field label="Mail Order" value={`${pp.mailOrderPercent}%`} />
            <Field label="Phone Order" value={`${pp.phoneOrderPercent}%`} />
          </>
        )}
        {pp.refundPolicyUrl && <Field label="Refund Policy" value={pp.refundPolicyUrl} />}
      </Section>

      <Section title="Ownership & Principals" stepIndex={2}>
        {data.owners.map((o, i) => (
          <div key={o.id} className={i > 0 ? 'mt-3 pt-3 border-t border-border/50' : ''}>
            <Field label={`Owner ${i + 1}`} value={`${o.firstName} ${o.lastName}`} />
            <Field label="Title" value={o.title} />
            <Field label="Ownership" value={`${o.ownershipPercent}%`} />
            <Field label="DOB" value={o.dob} />
            <Field label="Email" value={o.email} />
            <Field label="Phone" value={o.phone} />
            <Field label="Address" value={`${o.streetAddress}, ${o.city}, ${o.state} ${o.zip}`} />
          </div>
        ))}
      </Section>

      <Section title="Banking & Settlement" stepIndex={3}>
        <Field label="Bank" value={bk.bankName} />
        <Field label="Account Type" value={bk.accountType} />
        <Field label="Routing #" value={bk.routingNumber} />
        <Field label="Account #" value={`****${bk.accountNumber.slice(-4)}`} />
        {bk.voidedCheckFile && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2">Voided Check</p>
            <div className="w-32">
              <DocThumbnail file={bk.voidedCheckFile} frosted />
            </div>
          </div>
        )}
      </Section>

      <Section title="Documents" stepIndex={4}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {docs.driversLicenseFront && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">ID Front</p>
              <DocThumbnail file={docs.driversLicenseFront} frosted />
            </div>
          )}
          {docs.driversLicenseBack && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">ID Back</p>
              <DocThumbnail file={docs.driversLicenseBack} frosted />
            </div>
          )}
          {docs.bankStatements.map((f, i) => (
            <div key={i}>
              <p className="text-xs text-muted-foreground mb-1">Statement {i + 1}</p>
              <DocThumbnail file={f} />
            </div>
          ))}
        </div>
      </Section>

      <SignaturePad onSign={setSignature} signatureData={signature} />
      {sigError && <p className="field-error">{sigError}</p>}

      <div className="flex justify-between pt-4">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={handleSubmit} className="btn-accent">Submit Application</button>
      </div>
    </div>
  );
};

export default ReviewSubmit;
