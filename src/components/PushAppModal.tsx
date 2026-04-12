import { useState } from 'react';
import { PUSH_PROVIDERS, PushProviderId, PushRecord, StoredApplication } from '@/types/application';
import { pushApplication, cancelPush } from '@/lib/activityStore';
import { Loader2, Send, CheckCircle2, XCircle, ArrowRight, Check, Ban } from 'lucide-react';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  app: StoredApplication;
  onPushComplete: () => void;
}

type Phase = 'select' | 'pushing' | 'result' | 'cancel-confirm';

interface PushResult {
  provider: PushProviderId;
  providerName: string;
  record: PushRecord;
}

const PushAppModal = ({ open, onClose, app, onPushComplete }: Props) => {
  const [selectedProviders, setSelectedProviders] = useState<Set<PushProviderId>>(new Set());
  const [phase, setPhase] = useState<Phase>('select');
  const [pushResults, setPushResults] = useState<PushResult[]>([]);
  const [pushingIndex, setPushingIndex] = useState(0);
  const [pushingTotal, setPushingTotal] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<PushRecord | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Build a map of latest push status per provider
  const latestByProvider = new Map<PushProviderId, PushRecord>();
  if (app.pushHistory) {
    app.pushHistory.forEach((r) => latestByProvider.set(r.provider, r));
  }

  const reset = () => {
    setSelectedProviders(new Set());
    setPhase('select');
    setPushResults([]);
    setPushingIndex(0);
    setPushingTotal(0);
    setCancelTarget(null);
    setCancelling(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleProvider = (id: PushProviderId) => {
    setSelectedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePush = async () => {
    if (selectedProviders.size === 0) return;
    const providers = Array.from(selectedProviders);
    setPushingTotal(providers.length);
    setPushingIndex(0);
    setPhase('pushing');
    const results: PushResult[] = [];

    for (let i = 0; i < providers.length; i++) {
      const pid = providers[i];
      const provider = PUSH_PROVIDERS.find((p) => p.id === pid)!;
      setPushingIndex(i + 1);
      try {
        const record = await pushApplication(app.id, pid, provider.name);
        results.push({ provider: pid, providerName: provider.name, record });
      } catch {
        results.push({
          provider: pid,
          providerName: provider.name,
          record: {
            id: crypto.randomUUID(),
            provider: pid,
            pushedAt: new Date().toISOString(),
            status: 'error',
            responseMessage: 'Unexpected error occurred.',
          },
        });
      }
    }

    setPushResults(results);
    setPhase('result');
    onPushComplete();
  };

  const handleCancelPush = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    await cancelPush(app.id, cancelTarget.provider, PUSH_PROVIDERS.find((p) => p.id === cancelTarget.provider)?.name || cancelTarget.provider);
    setCancelling(false);
    setCancelTarget(null);
    setPhase('select');
    onPushComplete();
  };

  const successCount = pushResults.filter((r) => r.record.status !== 'error').length;
  const failCount = pushResults.filter((r) => r.record.status === 'error').length;

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {phase === 'select' && 'Push Application'}
            {phase === 'pushing' && `Sending (${pushingIndex}/${pushingTotal})...`}
            {phase === 'result' && (failCount === 0 ? 'All Sent Successfully' : `${successCount} Sent, ${failCount} Failed`)}
            {phase === 'cancel-confirm' && 'Cancel Submission?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {phase === 'select' && 'Select one or more providers to send this application to for boarding.'}
            {phase === 'pushing' && 'Please wait while we submit the application to selected providers.'}
            {phase === 'result' && 'See the results for each provider below.'}
            {phase === 'cancel-confirm' && `This will withdraw the application from ${PUSH_PROVIDERS.find((p) => p.id === cancelTarget?.provider)?.name}. The provider will be notified to stop processing.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {phase === 'select' && (
          <div className="space-y-2 py-2">
            {PUSH_PROVIDERS.map((p) => {
              const isSelected = selectedProviders.has(p.id);
              const latest = latestByProvider.get(p.id);
              const isPending = latest?.status === 'pending';
              const isAccepted = latest?.status === 'accepted';
              const isDisabled = isPending || isAccepted;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => !isDisabled && toggleProvider(p.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                    isDisabled
                      ? 'border-border bg-secondary/30 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/30 hover:bg-secondary/50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isDisabled ? (
                        <span className={`font-medium ${isPending ? 'text-warning' : 'text-accent'}`}>
                          {isPending ? 'Pending — awaiting response' : 'Accepted'}
                        </span>
                      ) : (
                        p.description
                      )}
                    </p>
                  </div>
                  {isDisabled ? (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      isPending ? 'bg-warning/10 text-warning' : 'bg-accent/10 text-accent'
                    }`}>
                      {latest?.status}
                    </span>
                  ) : (
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  )}
                </button>
              );
            })}

            {app.pushHistory && app.pushHistory.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Previous submissions</p>
                <div className="space-y-1.5">
                  {app.pushHistory.slice(-5).reverse().map((r) => {
                    const prov = PUSH_PROVIDERS.find((p) => p.id === r.provider);
                    const canCancel = r.status === 'pending';
                    return (
                      <div key={r.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-secondary/50">
                        <span className="text-foreground font-medium">{prov?.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            r.status === 'pending' ? 'bg-warning/10 text-warning' :
                            r.status === 'accepted' ? 'bg-accent/10 text-accent' :
                            r.status === 'cancelled' ? 'bg-muted text-muted-foreground' :
                            'bg-destructive/10 text-destructive'
                          }`}>
                            {r.status}
                          </span>
                          {canCancel && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setCancelTarget(r); setPhase('cancel-confirm'); }}
                              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-destructive hover:text-destructive/80 bg-destructive/5 hover:bg-destructive/10 px-1.5 py-0.5 rounded transition-colors"
                              title="Cancel this submission"
                            >
                              <Ban className="w-2.5 h-2.5" />
                              Cancel
                            </button>
                          )}
                          <span className="text-muted-foreground">{new Date(r.pushedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'pushing' && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">
              Sending to provider {pushingIndex} of {pushingTotal}...
            </p>
          </div>
        )}

        {phase === 'result' && (
          <div className="space-y-2 py-2">
            {pushResults.map((r) => (
              <div key={r.record.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2.5">
                  {r.record.status !== 'error' ? (
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      <XCircle className="w-4 h-4 text-destructive" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.providerName}</p>
                    <p className="text-xs text-muted-foreground">{r.record.responseMessage}</p>
                  </div>
                </div>
                {r.record.externalRef && (
                  <span className="text-[10px] font-mono text-muted-foreground">{r.record.externalRef}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {phase === 'cancel-confirm' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
              <Ban className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-sm text-foreground font-medium text-center">
              Withdraw from {PUSH_PROVIDERS.find((p) => p.id === cancelTarget?.provider)?.name}?
            </p>
            <p className="text-xs text-muted-foreground mt-1 text-center max-w-xs">
              This action will mark the submission as cancelled and notify the provider to stop processing this application.
            </p>
          </div>
        )}

        <AlertDialogFooter>
          {phase === 'select' && (
            <>
              <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
              <button
                onClick={handlePush}
                disabled={selectedProviders.size === 0}
                className="btn-accent flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                Push to {selectedProviders.size || ''} Provider{selectedProviders.size !== 1 ? 's' : ''}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {phase === 'result' && (
            <>
              {failCount > 0 && (
                <button onClick={() => { setPushResults([]); setPhase('select'); }} className="btn-secondary">
                  Retry Failed
                </button>
              )}
              <button onClick={handleClose} className="btn-primary">
                Done
              </button>
            </>
          )}
          {phase === 'cancel-confirm' && (
            <>
              <button onClick={() => { setCancelTarget(null); setPhase('select'); }} className="btn-secondary">
                Go Back
              </button>
              <button
                onClick={handleCancelPush}
                disabled={cancelling}
                className="btn-primary bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center gap-1.5 disabled:opacity-50"
              >
                {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PushAppModal;
