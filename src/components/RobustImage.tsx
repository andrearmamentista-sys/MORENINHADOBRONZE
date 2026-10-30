import React from 'react';
import { useImage } from '../hooks/useImage';
import { Sparkles } from 'lucide-react';

export interface RobustImageProps {
  src?: string | null;
  fallbackSrc?: string;
  additionalFallbacks?: string[];
  alt: string;
  title?: string;
  category?: string;
  className?: string;
  containerClassName?: string;
  showAmbientGlow?: boolean;
  aspectRatioClass?: string;
  objectFit?: 'contain' | 'cover';
}

export const RobustImage: React.FC<RobustImageProps> = ({
  src,
  fallbackSrc = '/images/service-hero.png',
  additionalFallbacks,
  alt,
  title,
  category,
  className = '',
  containerClassName = '',
  showAmbientGlow = false,
  aspectRatioClass = 'h-56',
  objectFit = 'contain',
}) => {
  const {
    src: resolvedSrc,
    isLoading,
    isLoaded,
    isPlaceholder,
    onError,
    onLoad,
  } = useImage({
    src,
    fallbackSrc,
    additionalFallbacks,
    title: title || alt,
    category,
  });

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center bg-gradient-to-b from-sky-100/60 via-slate-100/50 to-slate-100 ${aspectRatioClass} ${containerClassName}`}
    >
      {/* Loading Skeleton Shimmer */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-sky-100/80 to-slate-200 animate-pulse flex items-center justify-center z-5">
          <div className="flex flex-col items-center gap-2 text-sky-800/60">
            <Sparkles className="w-5 h-5 animate-spin" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Carregando foto...</span>
          </div>
        </div>
      )}

      {/* Ambient soft glow from the photo that softly dissolves with the background */}
      {showAmbientGlow && (
        <img
          src={resolvedSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-125 pointer-events-none transition-opacity duration-500"
          onError={onError}
        />
      )}

      {/* Left side dissolve gradient (eliminates side contour, blending with app card color) */}
      <div className="absolute inset-y-0 left-0 w-12 sm:w-16 bg-gradient-to-r from-slate-100 via-slate-100/90 to-transparent pointer-events-none z-10" />

      {/* Right side dissolve gradient (eliminates side contour, blending with app card color) */}
      <div className="absolute inset-y-0 right-0 w-12 sm:w-16 bg-gradient-to-l from-slate-100 via-slate-100/90 to-transparent pointer-events-none z-10" />

      {/* Bottom dissolve gradient (seamlessly melts into the card text area without any hard line) */}
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent pointer-events-none z-10" />

      {/* Top dissolve gradient (soft subtle melt into card top) */}
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-slate-100/80 via-slate-100/40 to-transparent pointer-events-none z-10" />

      {/* Main Foreground Image */}
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={onLoad}
        onError={onError}
        className={`w-full h-full p-2 transition-all duration-300 ${
          objectFit === 'cover' ? 'object-cover' : 'object-contain'
        } ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${className}`}
      />

      {/* Discreet badge if using guaranteed SVG fallback */}
      {isPlaceholder && isLoaded && (
        <div className="absolute bottom-2 right-2 text-[9px] font-bold text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-300 z-15 backdrop-blur-xs">
          Moreninha do Bronze
        </div>
      )}
    </div>
  );
};
