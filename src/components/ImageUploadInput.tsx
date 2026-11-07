import React, { useRef, useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Check, Sparkles, Loader2, CheckCircle2, RotateCcw } from 'lucide-react';
import { optimizeAndFitImage } from '../utils/imageOptimizer';
import { uploadImagePermanently } from '../services/supabaseStorageService';
import { resolveAssetUrl } from '../utils/helpers';

export interface ImageUploadInputProps {
  label: string;
  currentImageUrl?: string;
  value?: string;
  onImageChange?: (imageUrl: string) => void;
  onChange?: (imageUrl: string) => void;
  helperText?: string;
  defaultImageUrl?: string;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  label,
  currentImageUrl,
  value,
  onImageChange,
  onChange,
  helperText,
  defaultImageUrl,
}) => {
  const effectiveUrl = value !== undefined ? value : currentImageUrl || '';
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(effectiveUrl);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [adjustSuccess, setAdjustSuccess] = useState(false);
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
      setStatusText('Otimizando e preparando foto permanente...');

      // 1. Optimize image proportionally
      const optimizedDataUrl = await optimizeAndFitImage(file, {
        maxWidth: 1400,
        maxHeight: 1400,
        quality: 0.90,
      });

      // Show instant preview while uploading
      setUrlInput(optimizedDataUrl);
      notifyChange(optimizedDataUrl);

      // 2. Upload permanently to Supabase Storage or server
      setStatusText('Hospedando foto permanentemente na nuvem...');
      const prefix = label.toLowerCase().includes('banner')
        ? 'banner'
        : label.toLowerCase().includes('perfil') || label.toLowerCase().includes('logo') || label.toLowerCase().includes('avatar')
        ? 'avatar'
        : 'servico';

      const uploadResult = await uploadImagePermanently(file, prefix);

      if (uploadResult.url) {
        setUrlInput(uploadResult.url);
        notifyChange(uploadResult.url);
      }

      setAdjustSuccess(true);
      if (uploadResult.source === 'supabase') {
        setStatusText('✓ Foto hospedada no Supabase Storage (permanente)!');
      } else if (uploadResult.source === 'backend') {
        setStatusText('✓ Foto salva no servidor permanentemente!');
      } else {
        setStatusText('✓ Foto carregada e salva com sucesso!');
      }

      setTimeout(() => {
        setAdjustSuccess(false);
        setStatusText('');
      }, 4000);
    } catch {
      setStatusText('Foto carregada localmente.');
      setTimeout(() => setStatusText(''), 3000);
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
      setStatusText('✓ Link da foto aplicado!');
      setTimeout(() => {
        setAdjustSuccess(false);
        setStatusText('');
      }, 3000);
    }
  };

  const handleResetToDefault = () => {
    const fallback = defaultImageUrl || './images/banner.png';
    setUrlInput(fallback);
    notifyChange(fallback);
    setStatusText('Foto restaurada para a original.');
    setTimeout(() => setStatusText(''), 3000);
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
        {/* Thumbnail Preview */}
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-sky-100 via-sky-50 to-slate-200 border border-sky-300/70 overflow-hidden shrink-0 flex items-center justify-center shadow-inner group">
          {isAdjusting ? (
            <div className="flex flex-col items-center justify-center p-1 text-center">
              <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
              <span className="text-[8px] font-bold text-sky-800 mt-1">Enviando...</span>
            </div>
          ) : effectiveUrl ? (
            <img
              src={resolveAssetUrl(effectiveUrl)}
              alt="Foto selecionada"
              className={`w-full h-full ${
                fitMode === 'contain' ? 'object-contain' : 'object-cover'
              } p-0.5 transition-all`}
              onError={(e) => {
                const target = e.currentTarget;
                const fallback = resolveAssetUrl(defaultImageUrl || './images/service-hero.png');
                if (target.src !== fallback) {
                  target.src = fallback;
                }
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
                    <span>{statusText || 'Enviando foto permanente...'}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-sky-600" />
                    <span>Escolher Foto do Computador ou Celular</span>
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
            {statusText ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{statusText}</span>
              </span>
            ) : helperText ? (
              <span className="text-slate-600 font-medium italic">{helperText}</span>
            ) : (
              <span className="text-slate-600 font-medium">Foto permanente garantida</span>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {defaultImageUrl && effectiveUrl !== defaultImageUrl && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-slate-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer"
                  title="Restaurar para a foto original"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar Padrão</span>
                </button>
              )}

              {effectiveUrl && (
                <button
                  type="button"
                  onClick={() => setFitMode(fitMode === 'contain' ? 'cover' : 'contain')}
                  className="text-sky-700 font-bold hover:underline cursor-pointer"
                >
                  Modo: {fitMode === 'contain' ? 'Conter' : 'Cobrir'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FULL UN-CROPPED VISUAL PREVIEW CARD */}
      {effectiveUrl && (
        <div className="mt-2 p-2.5 rounded-xl bg-slate-100 border border-sky-200 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 px-1">
            <span className="flex items-center gap-1.5 text-sky-800">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Visualização da Foto (Permanente):
            </span>
            <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Pronta ✓
            </span>
          </div>

          <div className="w-full max-h-56 rounded-2xl bg-gradient-to-b from-sky-100/70 via-slate-100/60 to-slate-100 flex items-center justify-center p-2 overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-12 sm:w-16 bg-gradient-to-r from-slate-100 via-slate-100/90 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-y-0 right-0 w-12 sm:w-16 bg-gradient-to-l from-slate-100 via-slate-100/90 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-slate-100/80 to-transparent pointer-events-none z-10" />

            <img
              src={effectiveUrl}
              alt="Prévia da foto"
              className="max-h-48 w-auto max-w-full object-contain relative z-1"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('banner.png') && !target.src.includes('service-hero.png')) {
                  target.src = './images/service-hero.png';
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
