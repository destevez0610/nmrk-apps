import { useState } from 'react';
import { PUSH_PROVIDERS, PushProviderId, StoredApplication } from '@/types/application';
import { pushApplication } from '@/lib/activityStore';
import { Loader2, Send, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
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

type Phase = 'select' | 'pushing' | 'result';

const PushAppModal = ({ open, onClose, app, onPushComplete }: Props) => {
  const [selectedProvider, setSelectedProvider] = useState<PushProviderId | null>(null);
  const [phase, setPhase] = useState<Phase>('select');
  const [resultMessage, setResultMessage] = useState('');
  const [resultSuccess, setResultSuccess] = useState(false);

  const reset = () => {
    setSelectedProvider(null);
    setPhase('select');
    setResultMessage('');
    setResultSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePush = async () => {
    if (!selectedProvider) return;
    const provider = PUSH_PROVIDERS.find((p) => p.id === selectedProvider)!;
    setPhase('pushing');

    try {
      const record = await pushApplication(app.id, selectedProvider, provider.name);
      setResultSuccess(record.status !== 'error');
      setResultMessage(record.responseMessage || '');
      setPhase('result');
      onPushComplete();
    } catch {
      setResultSuccess(false);
      setResultMessage('An unexpected error occurred.');
      setPhase('result');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {phase === 'select' && 'Push Application'}
            {phase === 'pushing' && 'Sending...'}
            {phase === 'result' && (resultSuccess ? 'Sent Successfully' : 'Push Failed')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {phase === 'select' && 'Select a provider to send this application to for boarding.'}
            {phase === 'pushing' && 'Please wait while we submit the application.'}
            {phase === 'result' && resultMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {phase === 'select' && (
          <div className="space-y-2 py-2">
            {PUSH_PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProvider(p.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                  selectedProvider === p.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border hover:border-primary/30 hover:bg-secondary/50'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>
                {selectedProvider === p.id && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}

            {/* Push history for this app */}
            {app.pushHistory && app.pushHistory.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Previous submissions</p>
                <div className="space-y-1.5">
                  {app.pushHistory.slice(-3).reverse().map((r) => {
                    const prov = PUSH_PROVIDERS.find((p) => p.id === r.provider);
                    return (
                      <div key={r.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-secondary/50">
                        <span className="text-foreground font-medium">{prov?.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            r.status === 'pending' ? 'bg-warning/10 text-warning' :
                            r.status === 'accepted' ? 'bg-accent/10 text-accent' :
                            r.status === 'declined' ? 'bg-destructive/10 text-destructive' :
                            'bg-destructive/10 text-destructive'
                          }`}>
                            {r.status}
                          </span>
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
              Sending to {PUSH_PROVIDERS.find((p) => p.id === selectedProvider)?.name}...
            </p>
          </div>
        )}

        {phase === 'result' && (
          <div className="flex flex-col items-center py-6">
            {resultSuccess ? (
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-accent" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter>
          {phase === 'select' && (
            <>
              <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
              <button
                onClick={handlePush}
                disabled={!selectedProvider}
                className="btn-accent flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                Push App
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {phase === 'result' && (
            <>
              {!resultSuccess && (
                <button onClick={() => setPhase('select')} className="btn-secondary">
                  Try Again
                </button>
              )}
              <button onClick={handleClose} className="btn-primary">
                Done
              </button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PushAppModal;
