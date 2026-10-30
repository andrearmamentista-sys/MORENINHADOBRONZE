import React, { useRef, useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Link as LinkIcon, Check, X, Sparkles, Loader2, Maximize2, CheckCircle2 } from 'lucide-react';
import { optimizeAndFitImage } from '../utils/imageOptimizer';

export interface ImageUploadInputProps {
  label: string;
  currentImageUrl?: string;
  value?: string;
  onImageChange?: (imageUrl: string) => void;
  onChange?: (imageUrl: string) => void;
  helperText?: string;
  aspectRatioHint?: string;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  label,
  currentImageUrl,
  value,
  onImageChange,
  onChange,
  helperText,
}) => {
  const effectiveUrl = value !== undefined ? value : currentImageUrl || '';
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(effectiveUrl);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustSuccess, setAdjustSuccess] = useState(false);
  // Default to contain so the ENTIRE photo is visible without any cropping
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrlInput(effectiveUrl);
  }, [effectiveUrl]);

  const notifyChange = (newUrl: string) => {
    if (onImageChange) onImageChange(newUrl);
    if (onChange) onChange(newUrl);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsAdjusting(true);
      // Preserve 100% of the uploaded photo without cropping
      const adjustedDataUrl = await optimizeAndFitImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.92,
      });

      setUrlInput(adjustedDataUrl);
      notifyChange(adjustedDataUrl);
      setAdjustSuccess(true);
      setTimeout(() => setAdjustSuccess(false), 3500);
    } catch {
      // Debug desligado - falha silenciosa segura
    } finally {
      setIsAdjusting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlApply = () => {
    if (urlInput.trim()) {
      notifyChange(urlInput.trim());
      setAdjustSuccess(true);
      setTimeout(() => setAdjustSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-200/80 border border-slate-300">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          {label}
        </label>
        <div className="flex items-center gap-1 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              mode === 'upload' ? 'bg-sky-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:bg-slate-300'
            }`}
          >
            Dispositivo
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              mode === 'url' ? 'bg-sky-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:bg-slate-300'
            }`}
          >
            Link / URL
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3">
        {/* Thumbnail Preview with full photo containment and soft fading gradient */}
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-sky-100 via-sky-50 to-slate-200 border border-sky-300/70 overflow-hidden shrink-0 flex items-center justify-center shadow-inner group">
          {isAdjusting ? (
            <div className="flex flex-col items-center justify-center p-1 text-center">
              <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
              <span className="text-[8px] font-bold text-sky-800 mt-1">Carregando</span>
            </div>
          ) : effectiveUrl ? (
            <img
              src={effectiveUrl}
              alt="Foto inteira"
              className={`w-full h-full ${
                fitMode === 'contain' ? 'object-contain' : 'object-cover'
              } p-0.5 transition-all`}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-slate-400" />
          )}
        </div>

        {/* Action & Input Area */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {mode === 'upload' ? (
            <div>
              <button
                type="button"
                disabled={isAdjusting}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-sky-50 border border-dashed border-sky-300 hover:border-sky-500 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99] disabled:opacity-50"
              >
                {isAdjusting ? (
                  <>
                    <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                    <span>Carregando foto inteira...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-sky-600" />
                    <span>Escolher Foto Inteira do Aparelho (Sem Cortes)</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://exemplo.com/foto.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleUrlApply}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                title="Aplicar Link"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Feedback & Helper Labels */}
          <div className="flex items-center justify-between flex-wrap gap-1 text-[10px]">
            {adjustSuccess ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Foto completa carregada com 100% de visibilidade!
              </span>
            ) : helperText ? (
              <span className="text-slate-600 font-medium italic">{helperText}</span>
            ) : (
              <span className="text-slate-600 font-medium">Foto inteira preservada sem cortes</span>
            )}

            {effectiveUrl && (
              <button
                type="button"
                onClick={() => setFitMode(fitMode === 'contain' ? 'cover' : 'contain')}
                className="text-sky-700 font-bold hover:underline cursor-pointer ml-auto"
              >
                Modo: {fitMode === 'contain' ? 'Foto Inteira (Conter)' : 'Preencher (Cobrir)'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FULL UN-CROPPED VISUAL PREVIEW CARD */}
      {effectiveUrl && (
        <div className="mt-2 p-2.5 rounded-xl bg-slate-100 border border-sky-200 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 px-1">
            <span className="flex items-center gap-1.5 text-sky-800">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Visualização da Foto Inteira (100% sem cortes):
            </span>
            <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Completa ✓
            </span>
          </div>

          <div className="w-full max-h-56 rounded-2xl bg-gradient-to-b from-sky-100/70 via-slate-100/60 to-slate-100 flex items-center justify-center p-2 overflow-hidden relative">
            {/* Ambient soft glow */}
            <img
              src={effectiveUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 scale-125 pointer-events-none"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Left & Right side dissolve gradients (eliminates contour) */}
            <div className="absolute inset-y-0 left-0 w-12 sm:w-16 bg-gradient-to-r from-slate-100 via-slate-100/90 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-y-0 right-0 w-12 sm:w-16 bg-gradient-to-l from-slate-100 via-slate-100/90 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-slate-100/80 to-transparent pointer-events-none z-10" />

            <img
              src={effectiveUrl}
              alt="Prévia da foto inteira"
              className="max-h-48 w-auto max-w-full object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('/images/service-hero.png')) {
                  target.src = '/images/service-hero.png';
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
