import { useMemo, useEffect, useState, useRef } from 'react';
import { FileText } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const truncateName = (name: string, maxLen = 24): string => {
  if (name.length <= maxLen) return name;
  const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
  const base = name.slice(0, name.length - ext.length);
  const keep = maxLen - ext.length - 3;
  return base.slice(0, Math.max(keep, 6)) + '...' + ext;
};

const isImage = (file: File) => file.type.startsWith('image/');
const isPdf = (file: File) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const PdfPreview = ({ file }: { file: File }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = URL.createObjectURL(file);

    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        const page = await pdf.getPage(1);
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const viewport = page.getViewport({ scale: 1 });
        const scale = canvas.clientWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width * 2;
        canvas.height = scaledViewport.height * 2;

        const ctx = canvas.getContext('2d')!;
        ctx.scale(2, 2);
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => { cancelled = true; URL.revokeObjectURL(url); };
  }, [file]);

  if (failed) return <FileText className="w-8 h-8 text-muted-foreground" />;
  return <canvas ref={canvasRef} className="w-full h-full object-cover" />;
};

const DocThumbnail = ({ file }: { file: File }) => {
  const previewUrl = useMemo(() => {
    if (isImage(file)) return URL.createObjectURL(file);
    return null;
  }, [file]);

  return (
    <div className="rounded border border-border overflow-hidden bg-secondary w-full">
      <div className="aspect-[4/3] flex items-center justify-center overflow-hidden relative">
        {previewUrl ? (
          <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
        ) : isPdf(file) ? (
          <PdfPreview file={file} />
        ) : (
          <FileText className="w-8 h-8 text-muted-foreground" />
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
