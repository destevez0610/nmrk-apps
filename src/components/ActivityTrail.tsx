import { useState } from 'react';
import { ActivityEvent } from '@/types/application';
import { Send, Edit, AlertCircle, CheckCircle2, MessageSquare, RotateCw, PlusCircle, ArrowRightLeft, SendHorizonal } from 'lucide-react';

const EVENT_CONFIG: Record<string, { icon: typeof Send; color: string }> = {
  created: { icon: PlusCircle, color: 'text-primary' },
  edited: { icon: Edit, color: 'text-muted-foreground' },
  status_change: { icon: ArrowRightLeft, color: 'text-warning' },
  pushed: { icon: Send, color: 'text-primary' },
  push_response: { icon: CheckCircle2, color: 'text-accent' },
  push_error: { icon: AlertCircle, color: 'text-destructive' },
  note: { icon: MessageSquare, color: 'text-muted-foreground' },
  resend: { icon: RotateCw, color: 'text-primary' },
};

interface Props {
  events: ActivityEvent[];
  onAddNote?: (note: string) => void;
}

const ActivityTrail = ({ events, onAddNote }: Props) => {
  const [noteText, setNoteText] = useState('');

  const handleSubmitNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed || !onAddNote) return;
    onAddNote(trimmed);
    setNoteText('');
  };

  return (
    <div className="space-y-4">
      {/* Add note input */}
      {onAddNote && (
        <div className="flex gap-2">
          <input
            type="text"
            className="field-input flex-1"
            placeholder="Add a note..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitNote()}
          />
          <button
            onClick={handleSubmitNote}
            disabled={!noteText.trim()}
            className="btn-primary px-3 py-2 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendHorizonal className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No activity yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Actions like edits, submissions, and status changes will appear here.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-0">
            {events.map((event) => {
              const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.note;
              const Icon = config.icon;
              const time = new Date(event.timestamp);
              const dateStr = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

              return (
                <div key={event.id} className="relative flex gap-3 py-3 pl-1">
                  <div className={`relative z-10 flex items-center justify-center w-[30px] h-[30px] rounded-full bg-card border border-border shrink-0 ${config.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {dateStr} · {timeStr}
                      </span>
                    </div>
                    {event.detail && (
                      <p className="text-xs text-muted-foreground mt-0.5">{event.detail}</p>
                    )}
                    {event.provider && (
                      <span className="inline-block text-[10px] font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded mt-1">
                        {event.provider}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTrail;
