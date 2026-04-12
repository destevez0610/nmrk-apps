import { useMemo } from 'react';
import { useApplication } from '@/context/ApplicationContext';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionStatus {
  label: string;
  complete: boolean;
  hasData: boolean;
}

const useSectionStatuses = (): SectionStatus[] => {
  const { data, signature } = useApplication();

  return useMemo(() => {
    const bp = data.businessProfile;
    const pp = data.processingProfile;
    const owners = data.owners;
    const bk = data.banking;
    const docs = data.documents;

    const bpComplete = !!(bp.legalName && bp.businessStructure && bp.streetAddress && bp.city && bp.state && bp.zip && bp.phoneNumber && bp.industryType);
    const bpHasData = !!(bp.legalName || bp.dba || bp.streetAddress);

    const ppComplete = !!(pp.monthlyVolume && pp.averageTicket && pp.highTicket && (pp.cardPresentPercent + pp.cardNotPresentPercent === 100));
    const ppHasData = !!(pp.monthlyVolume || pp.averageTicket);

    const ownersComplete = owners.length > 0 && owners.every(o =>
      o.firstName && o.lastName && o.title && o.dob && o.ssn && o.streetAddress && o.city && o.state && o.zip && o.ownershipPercent && o.email && o.phone
    );
    const ownersHasData = owners.some(o => !!(o.firstName || o.lastName));

    const bkComplete = !!(bk.bankName && bk.routingNumber && bk.accountNumber && bk.accountType);
    const bkHasData = !!(bk.bankName || bk.routingNumber);

    const docsComplete = !!(docs.driversLicenseFront && docs.driversLicenseBack && docs.bankStatements.length >= 1);
    const docsHasData = !!(docs.driversLicenseFront || docs.bankStatements.length > 0);

    const sigComplete = !!signature;

    return [
      { label: 'Business Profile', complete: bpComplete, hasData: bpHasData },
      { label: 'Processing', complete: ppComplete, hasData: ppHasData },
      { label: 'Ownership', complete: ownersComplete, hasData: ownersHasData },
      { label: 'Banking', complete: bkComplete, hasData: bkHasData },
      { label: 'Documents', complete: docsComplete, hasData: docsHasData },
      { label: 'Signature', complete: sigComplete, hasData: sigComplete },
    ];
  }, [data, signature]);
};

interface Props {
  currentStep: number;
  onGoToStep?: (step: number) => void;
  className?: string;
}

const SectionChecklist = ({ currentStep, onGoToStep, className }: Props) => {
  const statuses = useSectionStatuses();
  const completedCount = statuses.filter(s => s.complete).length;

  return (
    <div className={cn('bg-card border border-border rounded-xl p-4 space-y-3', className)}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Completion</h3>
        <span className="text-[11px] font-medium text-muted-foreground">
          {completedCount}/{statuses.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / statuses.length) * 100}%` }}
        />
      </div>

      <div className="space-y-0.5 pt-1">
        {statuses.map((s, i) => {
          const isActive = i === currentStep;
          const isSigRow = i === 5;

          return (
            <button
              key={s.label}
              type="button"
              onClick={() => !isSigRow && onGoToStep?.(i)}
              disabled={isSigRow}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors text-xs',
                isActive && 'bg-primary/5',
                !isSigRow && 'hover:bg-secondary/80 cursor-pointer',
                isSigRow && 'cursor-default',
              )}
            >
              {s.complete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
              ) : s.hasData ? (
                <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              )}
              <span className={cn(
                'font-medium',
                s.complete ? 'text-foreground' : 'text-muted-foreground',
                isActive && 'text-primary',
              )}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SectionChecklist;
