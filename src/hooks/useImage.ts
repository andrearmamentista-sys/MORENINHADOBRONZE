import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getServicePlaceholderSvg } from '../utils/imagePlaceholders';
import { resolveAssetUrl } from '../utils/helpers';
import defaultHero from '../assets/service-hero.png';
import defaultBanner from '../assets/banner.png';

export interface UseImageOptions {
  src?: string | null;
  fallbackSrc?: string;
  additionalFallbacks?: string[];
  title?: string;
  category?: string;
}

export interface UseImageReturn {
  src: string;
  isLoading: boolean;
  isLoaded: boolean;
  isFallback: boolean;
  isPlaceholder: boolean;
  onError: () => void;
  onLoad: () => void;
  retry: () => void;
}

/**
 * Robust image loading hook:
 * Handles base paths, Supabase URLs, data URLs, and cascades through fallbacks.
 * Guaranteed NEVER to get stuck in an infinite "Carregando foto..." state.
 */
export function useImage({
  src,
  fallbackSrc = defaultHero,
  additionalFallbacks,
  title = 'Procedimento de Bronze',
  category = 'Bronzeamento Natural',
}: UseImageOptions): UseImageReturn {
  const svgFallback = useMemo(() => {
    return getServicePlaceholderSvg(title, category);
  }, [title, category]);

  // Serialize additional fallbacks to avoid unstable array reference re-renders
  const additionalStr = additionalFallbacks ? additionalFallbacks.join('|') : '';

  // Build candidate chain
  const candidateList = useMemo(() => {
    const list: string[] = [];
    const pushIfValid = (candidate?: string | null) => {
      if (!candidate || typeof candidate !== 'string') return;
      const t = candidate.trim();
      if (!t) return;
      const resolved = resolveAssetUrl(t);
      if (resolved && !list.includes(resolved)) list.push(resolved);
      if (!list.includes(t)) list.push(t);
      if (t.startsWith('/')) {
        const rel = `.${t}`;
        if (!list.includes(rel)) list.push(rel);
        const bare = t.slice(1);
        if (!list.includes(bare)) list.push(bare);
      }
      if (t.includes('/salon-images/')) {
        const filename = t.split('/salon-images/').pop()?.split('?')[0];
        if (filename) {
          const localUpload = `/uploads/${filename}`;
          const resolvedLocal = resolveAssetUrl(localUpload);
          if (resolvedLocal && !list.includes(resolvedLocal)) list.push(resolvedLocal);
          if (!list.includes(localUpload)) list.push(localUpload);
        }
      }
    };

    pushIfValid(src);
    pushIfValid(fallbackSrc);
    if (additionalFallbacks) {
      additionalFallbacks.forEach((fb) => pushIfValid(fb));
    }
    if (!list.includes(defaultHero)) list.push(defaultHero);
    if (!list.includes(defaultBanner)) list.push(defaultBanner);
    list.push(svgFallback);
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, fallbackSrc, additionalStr, svgFallback]);

  const [currentIndex, setCurrentIndex] = useState(0);
  // If image is a data URI or blob, it's immediately ready in memory
  const isImmediate = typeof src === 'string' && (src.startsWith('data:') || src.startsWith('blob:'));
  const [isLoading, setIsLoading] = useState(!isImmediate);
  const [isLoaded, setIsLoaded] = useState(isImmediate);
  const triedUrlsRef = useRef<Set<string>>(new Set());

  // Reset when primary src changes
  useEffect(() => {
    setCurrentIndex(0);
    const immediate = typeof src === 'string' && (src.startsWith('data:') || src.startsWith('blob:'));
    setIsLoading(!immediate);
    setIsLoaded(immediate);
    triedUrlsRef.current = new Set();
  }, [src]);

  const activeSrc = candidateList[currentIndex] || svgFallback;

  // Safety timer: Never allow isLoading to stay true for more than 800ms
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsLoaded(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [isLoading, activeSrc]);

  // DOM <img> onError callback to advance to next candidate
  const onError = useCallback(() => {
    triedUrlsRef.current.add(activeSrc);
    setIsLoading(false);
    setCurrentIndex((prev) => {
      const next = prev + 1;
      return next < candidateList.length ? next : candidateList.length - 1;
    });
  }, [activeSrc, candidateList.length]);

  const onLoad = useCallback(() => {
    setIsLoading(false);
    setIsLoaded(true);
  }, []);

  const retry = useCallback(() => {
    triedUrlsRef.current.clear();
    setCurrentIndex(0);
    setIsLoading(false);
    setIsLoaded(true);
  }, []);

  const isFallback = currentIndex > 0;
  const isPlaceholder = activeSrc.startsWith('data:image/svg+xml');

  return {
    src: activeSrc,
    isLoading: isLoading && !isPlaceholder,
    isLoaded,
    isFallback,
    isPlaceholder,
    onError,
    onLoad,
    retry,
  };
}
