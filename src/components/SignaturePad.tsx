import { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
  onSign: (dataUrl: string | null) => void;
  signatureData: string | null;
}

const SignaturePad = ({ onSign, signatureData }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(!!signatureData);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'hsl(220, 25%, 10%)';

    // Restore existing signature
    if (signatureData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = signatureData;
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (hasDrawn && canvasRef.current) {
      onSign(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    onSign(null);
  }, [onSign]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="field-label mb-0">Electronic Signature *</label>
        {hasDrawn && (
          <div className="flex items-center gap-1 text-xs text-accent font-medium">
            <Check className="w-3.5 h-3.5" /> Signed
          </div>
        )}
      </div>
      <div className="relative border-2 border-dashed border-border rounded-lg overflow-hidden bg-background hover:border-primary/30 transition-colors">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair touch-none"
          style={{ height: 150 }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground">Draw your signature here</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          By signing, you certify all information is accurate.
        </p>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <Eraser className="w-3.5 h-3.5" /> Clear
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
