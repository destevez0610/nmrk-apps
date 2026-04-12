import { useState } from 'react';
import { useApplication } from '@/context/ApplicationContext';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  onPrev: () => void;
}

const ReviewSubmit = ({ onPrev }: Props) => {
  const { data, isSubmitted, setIsSubmitted, confirmationId, setConfirmationId } = useApplication();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bp = data.businessProfile;
  const pp = data.processingProfile;
  const bk = data.banking;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
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

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      {children}
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{value || '—'}</span>
    </div>
  );

  return (
    <div className="wizard-card space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Review & Submit</h2>
        <p className="text-sm text-muted-foreground mt-1">Please review all information before submitting.</p>
      </div>

      <Section title="Business Profile">
        <Field label="Legal Name" value={bp.legalName} />
        <Field label="DBA" value={bp.dba} />
        <Field label="Structure" value={bp.businessStructure} />
        <Field label="Industry" value={bp.industryType} />
        <Field label="Address" value={`${bp.streetAddress}, ${bp.city}, ${bp.state} ${bp.zip}`} />
        <Field label="Phone" value={bp.phoneNumber} />
        <Field label="Website" value={bp.websiteUrl} />
      </Section>

      <Section title="Processing Profile">
        <Field label="Monthly Volume" value={`$${Number(pp.monthlyVolume).toLocaleString()}`} />
        <Field label="Average Ticket" value={`$${Number(pp.averageTicket).toLocaleString()}`} />
        <Field label="High Ticket" value={`$${Number(pp.highTicket).toLocaleString()}`} />
        <Field label="Card Present" value={`${pp.cardPresentPercent}%`} />
        <Field label="Card Not Present" value={`${pp.cardNotPresentPercent}%`} />
        {pp.refundPolicyUrl && <Field label="Refund Policy" value={pp.refundPolicyUrl} />}
      </Section>

      <Section title="Ownership">
        {data.owners.map((o, i) => (
          <div key={o.id} className={i > 0 ? 'mt-3 pt-3 border-t border-border/50' : ''}>
            <Field label={`Owner ${i + 1}`} value={`${o.firstName} ${o.lastName} — ${o.title}`} />
            <Field label="Ownership" value={`${o.ownershipPercent}%`} />
            <Field label="Address" value={`${o.streetAddress}, ${o.city}, ${o.state} ${o.zip}`} />
          </div>
        ))}
      </Section>

      <Section title="Banking">
        <Field label="Bank" value={bk.bankName} />
        <Field label="Account Type" value={bk.accountType} />
        <Field label="Routing #" value={bk.routingNumber} />
        <Field label="Account #" value={`****${bk.accountNumber.slice(-4)}`} />
        <Field label="Voided Check" value={bk.voidedCheckFile?.name || '—'} />
      </Section>

      <Section title="Documents">
        <Field label="ID Front" value={data.documents.driversLicenseFront?.name || '—'} />
        <Field label="ID Back" value={data.documents.driversLicenseBack?.name || '—'} />
        <Field label="Bank Statements" value={`${data.documents.bankStatements.length} file(s)`} />
      </Section>

      <div className="flex justify-between pt-4">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={handleSubmit} className="btn-accent">Submit Application</button>
      </div>
    </div>
  );
};

export default ReviewSubmit;
