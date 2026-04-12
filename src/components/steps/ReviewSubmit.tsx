import { useState, useMemo } from 'react';
import { useApplication } from '@/context/ApplicationContext';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Pencil, FileText, Save } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SignaturePad from '@/components/SignaturePad';

interface Props {
  onPrev: () => void;
  onGoToStep?: (step: number) => void;
  onSaveAndGoToStep?: (step: number) => void;
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

const DocThumbnail = ({ file, frosted = false }: { file: File; frosted?: boolean }) => {
  const previewUrl = useMemo(() => {
    if (isImage(file)) return URL.createObjectURL(file);
    return null;
  }, [file]);

  return (
    <div className="rounded border border-border overflow-hidden bg-secondary w-full">
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
      <div className="px-2 py-1 bg-card border-t border-border">
        <p className="text-[10px] text-muted-foreground truncate" title={file.name}>
          {truncateName(file.name)}
        </p>
      </div>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string | number }) => (
  <div className="grid grid-cols-[140px_1fr] py-1.5 border-b border-dashed border-border/60 last:border-0">
    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
    <span className="text-xs text-foreground">{value || '—'}</span>
  </div>
);

const SectionHeader = ({
  title,
  sectionNumber,
  stepIndex,
  onEdit,
}: {
  title: string;
  sectionNumber: number;
  stepIndex: number;
  onEdit?: (stepIndex: number) => void;
}) => (
  <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-primary/30">
    <div className="flex items-center gap-2.5">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
        {sectionNumber}
      </span>
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">{title}</h3>
    </div>
    {onEdit && (
      <button
        type="button"
        onClick={() => onEdit(stepIndex)}
        className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors font-medium"
      >
        <Pencil className="w-3 h-3" />
        Edit
      </button>
    )}
  </div>
);

const ReviewSubmit = ({ onPrev, onGoToStep, onSaveAndGoToStep }: Props) => {
  const { data, isSubmitted, setIsSubmitted, confirmationId, setConfirmationId, signature, setSignature } = useApplication();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sigError, setSigError] = useState('');
  const [editTarget, setEditTarget] = useState<number | null>(null);
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

  const handleEditClick = (stepIndex: number) => setEditTarget(stepIndex);

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

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Document container */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Document header — like a letterhead */}
        <div className="bg-primary/[0.04] border-b border-border px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">Merchant Application</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Maverick Payments — Application for Review</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Date</p>
              <p className="text-xs font-medium text-foreground">{today}</p>
            </div>
          </div>
        </div>

        {/* Document body — sectioned like a formal application */}
        <div className="px-6 py-5 space-y-6">

          {/* Section 1: Business Profile */}
          <section>
            <SectionHeader title="Business Profile" sectionNumber={1} stepIndex={0} onEdit={onGoToStep ? handleEditClick : undefined} />
            <div className="pl-8">
              <Field label="Legal Name" value={bp.legalName} />
              <Field label="DBA" value={bp.dba} />
              <Field label="Structure" value={bp.businessStructure} />
              <Field label="Industry" value={bp.industryType} />
              <Field label="Address" value={`${bp.streetAddress}, ${bp.city}, ${bp.state} ${bp.zip}`} />
              <Field label="Phone" value={bp.phoneNumber} />
              <Field label="Website" value={bp.websiteUrl} />
            </div>
          </section>

          <div className="border-t border-border/40" />

          {/* Section 2: Processing Profile */}
          <section>
            <SectionHeader title="Processing Profile" sectionNumber={2} stepIndex={1} onEdit={onGoToStep ? handleEditClick : undefined} />
            <div className="pl-8">
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
            </div>
          </section>

          <div className="border-t border-border/40" />

          {/* Section 3: Ownership & Principals */}
          <section>
            <SectionHeader title="Ownership & Principals" sectionNumber={3} stepIndex={2} onEdit={onGoToStep ? handleEditClick : undefined} />
            <div className="pl-8 space-y-4">
              {data.owners.map((o, i) => (
                <div key={o.id} className={i > 0 ? 'pt-3 border-t border-dashed border-border/50' : ''}>
                  <p className="text-[11px] font-semibold text-primary mb-1.5 uppercase tracking-wider">
                    Principal {i + 1}
                  </p>
                  <Field label="Name" value={`${o.firstName} ${o.lastName}`} />
                  <Field label="Title" value={o.title} />
                  <Field label="Ownership" value={`${o.ownershipPercent}%`} />
                  <Field label="Date of Birth" value={o.dob} />
                  <Field label="Email" value={o.email} />
                  <Field label="Phone" value={o.phone} />
                  <Field label="Address" value={`${o.streetAddress}, ${o.city}, ${o.state} ${o.zip}`} />
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-border/40" />

          {/* Section 4: Banking & Settlement */}
          <section>
            <SectionHeader title="Banking & Settlement" sectionNumber={4} stepIndex={3} onEdit={onGoToStep ? handleEditClick : undefined} />
            <div className="pl-8">
              <Field label="Bank Name" value={bk.bankName} />
              <Field label="Account Type" value={bk.accountType} />
              <Field label="Routing #" value={bk.routingNumber} />
              <Field label="Account #" value={`****${bk.accountNumber.slice(-4)}`} />
              {bk.voidedCheckFile && (
                <div className="mt-3">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">Voided Check</p>
                  <div className="w-28">
                    <DocThumbnail file={bk.voidedCheckFile} frosted />
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="border-t border-border/40" />

          {/* Section 5: Documents */}
          <section>
            <SectionHeader title="Supporting Documents" sectionNumber={5} stepIndex={4} onEdit={onGoToStep ? handleEditClick : undefined} />
            <div className="pl-8">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {docs.driversLicenseFront && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">ID Front</p>
                    <DocThumbnail file={docs.driversLicenseFront} frosted />
                  </div>
                )}
                {docs.driversLicenseBack && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">ID Back</p>
                    <DocThumbnail file={docs.driversLicenseBack} frosted />
                  </div>
                )}
                {docs.bankStatements.map((f, i) => (
                  <div key={i}>
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Statement {i + 1}</p>
                    <DocThumbnail file={f} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Signature area — inside the document */}
        <div className="border-t border-border px-6 py-5 bg-primary/[0.02]">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
              6
            </span>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Authorization</h3>
          </div>
          <div className="pl-8">
            <SignaturePad onSign={setSignature} signatureData={signature} />
            {sigError && <p className="field-error mt-1">{sigError}</p>}
          </div>
        </div>
      </div>

      {/* Action buttons outside the "document" */}
      <div className="flex justify-between pt-2">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={handleSubmit} className="btn-accent">Submit Application</button>
      </div>

      {/* Edit confirmation dialog */}
      <AlertDialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Review Page?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll be taken back to edit this section. You can save your draft first or continue without saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {onSaveAndGoToStep && (
              <AlertDialogAction
                onClick={() => { if (editTarget !== null) onSaveAndGoToStep(editTarget); }}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save & Edit
              </AlertDialogAction>
            )}
            <AlertDialogAction onClick={() => { if (editTarget !== null && onGoToStep) onGoToStep(editTarget); }}>
              Continue to Edit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReviewSubmit;
