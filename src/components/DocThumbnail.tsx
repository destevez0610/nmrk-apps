import { useMemo } from 'react';
import { FileText } from 'lucide-react';

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

export default DocThumbnail;
