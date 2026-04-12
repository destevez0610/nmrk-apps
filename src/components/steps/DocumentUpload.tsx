import { useState, useCallback } from 'react';
import { useApplication } from '@/context/ApplicationContext';
import { Upload, X, FileText } from 'lucide-react';

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const DocumentUpload = ({ onNext, onPrev }: Props) => {
  const { data, updateData } = useApplication();
  const docs = data.documents;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const volumeOver25k = Number(data.processingProfile.monthlyVolume) > 25000;

  const update = (fields: Partial<typeof docs>) => updateData('documents', fields);

  const FileDropZone = ({
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
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); e.dataTransfer.files[0] && onFile(e.dataTransfer.files[0]); }}
        onClick={() => document.getElementById(id)?.click()}
        className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
      >
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">{file.name}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); onClear(); }} className="text-destructive hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Drop or click to upload</p>
          </div>
        )}
        <input id={id} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FileDropZone label="Front *" file={docs.driversLicenseFront} id="dl-front"
              onFile={(f) => update({ driversLicenseFront: f })} onClear={() => update({ driversLicenseFront: null })} />
            {errors.front && <p className="field-error">{errors.front}</p>}
          </div>
          <div>
            <FileDropZone label="Back *" file={docs.driversLicenseBack} id="dl-back"
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
          <div className="space-y-2 mb-3">
            {docs.bankStatements.map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary text-sm">
                <FileText className="w-4 h-4 text-primary" />
                <span className="flex-1 text-foreground">{f.name}</span>
                <button type="button" onClick={() =>
                  update({ bankStatements: docs.bankStatements.filter((_, j) => j !== i) })
                } className="text-destructive hover:opacity-70">
                  <X className="w-4 h-4" />
                </button>
              </div>
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
