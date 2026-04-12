import { useState, useCallback } from 'react';
import { useApplication } from '@/context/ApplicationContext';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Pencil, Save, Printer, ChevronDown, ChevronsUpDown } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import SignaturePad from '@/components/SignaturePad';
import DocThumbnail from '@/components/DocThumbnail';
import ReadOnlyField from '@/components/ReadOnlyField';
import { format } from 'date-fns';
import { updateApplicationData, createApplication } from '@/lib/applicationsStore';

interface Props {
  onPrev: () => void;
  onGoToStep?: (step: number) => void;
  onSaveAndGoToStep?: (step: number) => void;
}

const CollapsibleSection = ({
  title,
  subtitle,
  sectionNumber,
  stepIndex,
  onEdit,
  rightContent,
  children,
  open,
  onToggle,
}: {
  title: string;
  subtitle: string;
  sectionNumber: number;
  stepIndex: number;
  onEdit?: (stepIndex: number) => void;
  rightContent?: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) => {
  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <div className="flex items-start justify-between mb-4">
        <CollapsibleTrigger asChild>
          <button type="button" className="flex items-start gap-3 group text-left">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
              {sectionNumber}
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                {title}
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            </div>
          </button>
        </CollapsibleTrigger>
        <div className="flex items-center gap-3">
          {rightContent}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(stepIndex)}
              className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors font-medium px-2.5 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          )}
        </div>
      </div>
      <CollapsibleContent>
        <div className="pl-10">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const ReviewSubmit = ({ onPrev, onGoToStep, onSaveAndGoToStep }: Props) => {
  const { data, isSubmitted, setIsSubmitted, confirmationId, setConfirmationId, signature, setSignature, storedAppId } = useApplication();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sigError, setSigError] = useState('');
  const [editTarget, setEditTarget] = useState<number | null>(null);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true, 4: true, 5: true });
  const bp = data.businessProfile;
  const pp = data.processingProfile;
  const bk = data.banking;
  const docs = data.documents;

  const allExpanded = Object.values(openSections).every(Boolean);
  const toggleAll = useCallback(() => {
    const newState = !allExpanded;
    setOpenSections({ 1: newState, 2: newState, 3: newState, 4: newState, 5: newState });
  }, [allExpanded]);
  const toggleSection = (n: number) => () => setOpenSections((prev) => ({ ...prev, [n]: !prev[n] }));

  const handleSubmit = async () => {
    if (!signature) {
      setSigError('Please sign before submitting.');
      return;
    }
    setSigError('');
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 3000));
    const confId = `MAV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setConfirmationId(confId);
    // Update existing stored application or create new one
    if (storedAppId) {
      updateApplicationData(storedAppId, { status: 'submitted', confirmationId: confId, data, signature });
    } else {
      const stored = createApplication(data, 'submitted', confId);
      updateApplicationData(stored.id, { signature });
    }
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
  const isSoleProp = bp.businessStructure === 'Sole Proprietorship';
  const editHandler = onGoToStep ? handleEditClick : undefined;
  const totalOwnership = data.owners.reduce((sum, o) => sum + (Number(o.ownershipPercent) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Document header */}
        <div className="bg-primary/[0.04] border-b border-border px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">Merchant Application</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Maverick Payments — Application for Review</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">Date</p>
                <p className="text-xs font-medium text-foreground">{today}</p>
              </div>
              <button
                type="button"
                onClick={toggleAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors print:hidden"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
                {allExpanded ? 'Collapse All' : 'Expand All'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors print:hidden"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / PDF
              </button>
            </div>
          </div>
        </div>

        {/* Document body */}
        <div className="px-6 py-6 space-y-8">

          {/* Section 1: Business Profile */}
          <CollapsibleSection title="Business Profile" subtitle="Entity and contact information" sectionNumber={1} stepIndex={0} onEdit={editHandler} open={openSections[1]} onToggle={toggleSection(1)}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReadOnlyField label="Legal Business Name" value={bp.legalName} />
                <ReadOnlyField label="DBA (Doing Business As)" value={bp.dba} optional />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReadOnlyField label="Business Structure" value={bp.businessStructure} />
                {isSoleProp ? (
                  <ReadOnlyField label="Social Security Number" value={bp.ssn ? '•••-••-' + bp.ssn.replace(/\D/g, '').slice(-4) : ''} />
                ) : (
                  <ReadOnlyField label="EIN (Employer ID)" value={bp.ein} />
                )}
              </div>
              <ReadOnlyField label="Industry Type" value={bp.industryType} />
              <div>
                <label className="field-label">Physical Business Address</label>
                <div className="field-input bg-secondary/50 cursor-default text-foreground mb-3">
                  {bp.streetAddress || '—'}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="field-input bg-secondary/50 cursor-default text-foreground">{bp.city || '—'}</div>
                  <div className="field-input bg-secondary/50 cursor-default text-foreground">{bp.state || '—'}</div>
                  <div className="field-input bg-secondary/50 cursor-default text-foreground">{bp.zip || '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReadOnlyField label="Business Phone" value={bp.phoneNumber} />
                <ReadOnlyField label="Website URL" value={bp.websiteUrl} optional />
              </div>
              {bp.businessStartDate && (
                <ReadOnlyField label="Business Start Date" value={format(new Date(bp.businessStartDate + 'T00:00:00'), 'MM/dd/yyyy')} optional />
              )}
            </div>
          </CollapsibleSection>

          <div className="border-t border-border/40" />

          {/* Section 2: Processing Profile */}
          <CollapsibleSection title="Processing Profile" subtitle="Volume and transaction details" sectionNumber={2} stepIndex={1} onEdit={editHandler} open={openSections[2]} onToggle={toggleSection(2)}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ReadOnlyField label="Monthly Volume" value={`$${Number(pp.monthlyVolume).toLocaleString()}`} />
                <ReadOnlyField label="Average Ticket" value={`$${Number(pp.averageTicket).toLocaleString()}`} />
                <ReadOnlyField label="High Ticket" value={`$${Number(pp.highTicket).toLocaleString()}`} />
              </div>
              <div>
                <label className="field-label">Transaction Split</label>
                <div className="grid grid-cols-2 gap-4 mt-1">
                  <div>
                    <label className="text-xs text-muted-foreground">Card-Present %</label>
                    <div className="field-input bg-secondary/50 cursor-default text-foreground mt-1">{pp.cardPresentPercent}%</div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Card-Not-Present %</label>
                    <div className="field-input bg-secondary/50 cursor-default text-foreground mt-1">{pp.cardNotPresentPercent}%</div>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden flex">
                  <div className="bg-primary transition-all duration-300" style={{ width: `${pp.cardPresentPercent}%` }} />
                  <div className="bg-accent transition-all duration-300" style={{ width: `${pp.cardNotPresentPercent}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>Present: {pp.cardPresentPercent}%</span>
                  <span>Not-Present: {pp.cardNotPresentPercent}%</span>
                </div>
              </div>
              {pp.cardNotPresentPercent > 0 && (
                <div>
                  <label className="field-label">Card-Not-Present Breakdown</label>
                  <div className="grid grid-cols-3 gap-3 mt-1">
                    <div>
                      <label className="text-xs text-muted-foreground">E-Commerce %</label>
                      <div className="field-input bg-secondary/50 cursor-default text-foreground mt-1">{pp.ecommercePercent}%</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Mail Order %</label>
                      <div className="field-input bg-secondary/50 cursor-default text-foreground mt-1">{pp.mailOrderPercent}%</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Phone Order %</label>
                      <div className="field-input bg-secondary/50 cursor-default text-foreground mt-1">{pp.phoneOrderPercent}%</div>
                    </div>
                  </div>
                </div>
              )}
              {pp.refundPolicyUrl && (
                <ReadOnlyField label="Refund Policy URL" value={pp.refundPolicyUrl} />
              )}
              {/* ACH */}
              <div className="border-t border-border/40 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">ACH Processing</h4>
                <ReadOnlyField label="Accepts ACH Payments" value={pp.acceptsAch ? 'Yes' : 'No'} />
                {pp.acceptsAch && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <ReadOnlyField label="ACH Monthly Volume" value={pp.achMonthlyVolume ? `$${Number(pp.achMonthlyVolume).toLocaleString()}` : ''} />
                    <ReadOnlyField label="ACH Average Ticket" value={pp.achAverageTicket ? `$${Number(pp.achAverageTicket).toLocaleString()}` : ''} />
                    <ReadOnlyField label="ACH High Ticket" value={pp.achHighTicket ? `$${Number(pp.achHighTicket).toLocaleString()}` : ''} />
                  </div>
                )}
                {pp.acceptsAch && pp.achCurrentProvider && (
                  <div className="mt-3">
                    <ReadOnlyField label="ACH Current Provider" value={pp.achCurrentProvider} />
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>

          <div className="border-t border-border/40" />

          {/* Section 3: Ownership & Principals */}
          <CollapsibleSection
            title="Ownership & Principals"
            subtitle="All owners with ≥25% stake"
            sectionNumber={3}
            stepIndex={2}
            onEdit={editHandler}
            open={openSections[3]}
            onToggle={toggleSection(3)}
            rightContent={
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${totalOwnership === 100 ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'}`}>
                {totalOwnership}% / 100%
              </span>
            }
          >
            <div className="space-y-6">
              {data.owners.map((o, i) => (
                <div key={o.id} className={`space-y-4 ${i > 0 ? 'pt-4 border-t border-dashed border-border/50' : ''}`}>
                  <h4 className="text-sm font-semibold text-foreground">Owner {i + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ReadOnlyField label="First Name" value={o.firstName} />
                    <ReadOnlyField label="Last Name" value={o.lastName} />
                    <ReadOnlyField label="Title" value={o.title} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <ReadOnlyField label="Date of Birth" value={o.dob ? format(new Date(o.dob + 'T00:00:00'), 'MM/dd/yyyy') : ''} />
                    <ReadOnlyField label="SSN" value={o.ssn ? '•••-••-' + o.ssn.replace(/\D/g, '').slice(-4) : ''} />
                    <ReadOnlyField label="Ownership %" value={`${o.ownershipPercent}%`} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ReadOnlyField label="Email" value={o.email} />
                    <ReadOnlyField label="Phone" value={o.phone} />
                  </div>
                  <div>
                    <label className="field-label">Home Address</label>
                    <div className="field-input bg-secondary/50 cursor-default text-foreground mb-3">
                      {o.streetAddress || '—'}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="field-input bg-secondary/50 cursor-default text-foreground">{o.city || '—'}</div>
                      <div className="field-input bg-secondary/50 cursor-default text-foreground">{o.state || '—'}</div>
                      <div className="field-input bg-secondary/50 cursor-default text-foreground">{o.zip || '—'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <div className="border-t border-border/40" />

          {/* Section 4: Banking & Settlement */}
          <CollapsibleSection title="Banking & Settlement" subtitle="Where funds will be deposited" sectionNumber={4} stepIndex={3} onEdit={editHandler} open={openSections[4]} onToggle={toggleSection(4)}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReadOnlyField label="Bank Name" value={bk.bankName} />
                <ReadOnlyField label="Account Type" value={bk.accountType} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReadOnlyField label="Routing Number" value={bk.routingNumber} />
                <ReadOnlyField label="Account Number" value={bk.accountNumber ? `****${bk.accountNumber.slice(-4)}` : '—'} />
              </div>
              <div>
                <label className="field-label">Voided Check or Bank Letter</label>
                {bk.voidedCheckFile ? (
                  <div className="w-32 mt-1">
                    <DocThumbnail file={bk.voidedCheckFile} />
                  </div>
                ) : (
                  <div className="field-input bg-secondary/50 cursor-default text-muted-foreground">Not uploaded</div>
                )}
              </div>
            </div>
          </CollapsibleSection>

          <div className="border-t border-border/40" />

          {/* Section 5: Documents */}
          <CollapsibleSection title="Document Upload" subtitle="Supporting documentation for underwriting" sectionNumber={5} stepIndex={4} onEdit={editHandler} open={openSections[5]} onToggle={toggleSection(5)}>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Driver's License / Government ID</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Front</label>
                    {docs.driversLicenseFront ? (
                      <DocThumbnail file={docs.driversLicenseFront} />
                    ) : (
                      <div className="field-input bg-secondary/50 cursor-default text-muted-foreground">Not uploaded</div>
                    )}
                  </div>
                  <div>
                    <label className="field-label">Back</label>
                    {docs.driversLicenseBack ? (
                      <DocThumbnail file={docs.driversLicenseBack} />
                    ) : (
                      <div className="field-input bg-secondary/50 cursor-default text-muted-foreground">Not uploaded</div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Bank Statements</h4>
                {docs.bankStatements.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {docs.bankStatements.map((f, i) => (
                      <div key={i}>
                        <label className="field-label">Statement {i + 1}</label>
                        <DocThumbnail file={f} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="field-input bg-secondary/50 cursor-default text-muted-foreground">No statements uploaded</div>
                )}
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* Signature area */}
        <div className="border-t border-border px-6 py-5 bg-primary/[0.02]">
          <div className="flex items-start gap-3 mb-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
              6
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">Authorization</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Electronic signature required</p>
            </div>
          </div>
          <div className="pl-10">
            <SignaturePad onSign={setSignature} signatureData={signature} />
            {sigError && <p className="field-error mt-1">{sigError}</p>}
          </div>
        </div>
      </div>

      {/* Action buttons */}
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
