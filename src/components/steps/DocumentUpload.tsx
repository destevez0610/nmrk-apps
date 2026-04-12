import { useState, useCallback, useMemo } from 'react';
import { useApplication } from '@/context/ApplicationContext';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { scrollToFirstError } from '@/lib/scrollToError';

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

/** Truncate filename: keep start + extension, ellipsis in the middle */
const truncateName = (name: string, maxLen = 20): string => {
  if (name.length <= maxLen) return name;
  const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
  const base = name.slice(0, name.length - ext.length);
  const keep = maxLen - ext.length - 3; // 3 for "..."
  return base.slice(0, Math.max(keep, 6)) + '...' + ext;
};

/** Check if file is an image */
const isImage = (file: File) => file.type.startsWith('image/');

/** Thumbnail component for uploaded files */
const FileThumbnail = ({
  file,
  onClear,
}: {
  file: File;
  onClear: () => void;
}) => {
  const previewUrl = useMemo(() => {
    if (isImage(file)) return URL.createObjectURL(file);
    return null;
  }, [file]);

  return (
    <div className="relative group rounded-lg border border-border overflow-hidden bg-secondary">
      <div className="aspect-[4/3] flex items-center justify-center overflow-hidden">
        {previewUrl ? (
          <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <FileText className="w-10 h-10 text-muted-foreground" />
        )}
      </div>
      <div className="px-2 py-1.5 bg-card border-t border-border">
        <p className="text-xs text-foreground truncate" title={file.name}>
          {truncateName(file.name)}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {(file.size / 1024).toFixed(0)} KB
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClear(); }}
        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

const DocumentUpload = ({ onNext, onPrev }: Props) => {
  const { data, updateData } = useApplication();
  const docs = data.documents;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const volumeOver25k = Number(data.processingProfile.monthlyVolume) > 25000;

  const update = (fields: Partial<typeof docs>) => updateData('documents', fields);

  const DropZone = ({
    label,
    file,
    onFile,
    onClear,
    id,
  }: {
    label: string;
    file: File | null;
    onFile: (f: File) => void;
    onClear: () => void;
    id: string;
  }) => (
    <div>
      <label className="field-label">{label}</label>
      {file ? (
        <FileThumbnail file={file} onClear={onClear} />
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); e.dataTransfer.files[0] && onFile(e.dataTransfer.files[0]); }}
          onClick={() => document.getElementById(id)?.click()}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
        >
          <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
          <p className="text-xs text-muted-foreground mt-1">Drop or click to upload</p>
          <input id={id} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </div>
      )}
    </div>
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!docs.driversLicenseFront) e.front = 'Front of ID required';
    if (!docs.driversLicenseBack) e.back = 'Back of ID required';
    if (volumeOver25k && docs.bankStatements.length < 3) {
      e.statements = 'At least 3 months of bank statements required for volume > $25k';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) scrollToFirstError();
    return Object.keys(e).length === 0;
  };

  return (
    <div className="wizard-card space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Document Upload</h2>
        <p className="text-sm text-muted-foreground mt-1">Supporting documentation for underwriting</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Driver's License / Government ID</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <DropZone label="Front *" file={docs.driversLicenseFront} id="dl-front"
              onFile={(f) => update({ driversLicenseFront: f })} onClear={() => update({ driversLicenseFront: null })} />
            {errors.front && <p className="field-error">{errors.front}</p>}
          </div>
          <div>
            <DropZone label="Back *" file={docs.driversLicenseBack} id="dl-back"
              onFile={(f) => update({ driversLicenseBack: f })} onClear={() => update({ driversLicenseBack: null })} />
            {errors.back && <p className="field-error">{errors.back}</p>}
          </div>
        </div>
      </div>

      {/* Bank Statements */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Bank Statements</h3>
        <p className="text-xs text-muted-foreground mb-3">
          {volumeOver25k
            ? 'Required: Upload the most recent 3 months of bank statements.'
            : 'Optional but recommended.'}
        </p>

        {docs.bankStatements.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            {docs.bankStatements.map((f, i) => (
              <FileThumbnail
                key={i}
                file={f}
                onClear={() => update({ bankStatements: docs.bankStatements.filter((_, j) => j !== i) })}
              />
            ))}
          </div>
        )}

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            update({ bankStatements: [...docs.bankStatements, ...files] });
          }}
          onClick={() => document.getElementById('bank-statements')?.click()}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
        >
          <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
          <p className="text-xs text-muted-foreground">Drop or click to upload statements</p>
          <input id="bank-statements" type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              if (e.target.files) update({ bankStatements: [...docs.bankStatements, ...Array.from(e.target.files)] });
            }} />
        </div>
        {errors.statements && <p className="field-error mt-1">{errors.statements}</p>}
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={onPrev} className="btn-secondary">Back</button>
        <button onClick={() => validate() && onNext()} className="btn-primary">Continue to Review</button>
      </div>
    </div>
  );
};

export default DocumentUpload;
