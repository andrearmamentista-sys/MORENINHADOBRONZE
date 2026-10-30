import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getServicePlaceholderSvg } from '../utils/imagePlaceholders';

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
 * Robust image loading hook with cascade fallbacks:
 * 1. Primary source (user/service image or URL)
 * 2. Primary fallback source (e.g. /images/service-hero.png)
 * 3. Additional public fallbacks (e.g. /images/banner.png)
 * 4. Self-contained bronze SVG placeholder (never fails, 100% offline, zero network)
 */
export function useImage({
  src,
  fallbackSrc = '/images/service-hero.png',
  additionalFallbacks = ['/images/banner.png', '/images/banner-thumb.png'],
  title = 'Procedimento de Bronze',
  category = 'Bronzeamento Natural',
}: UseImageOptions): UseImageReturn {
  // Generate self-contained SVG fallback as ultimate safety net
  const svgFallback = useMemo(() => {
    return getServicePlaceholderSvg(title, category);
  }, [title, category]);

  // Build candidate chain (removing falsy/duplicates)
  const candidateList = useMemo(() => {
    const list: string[] = [];
    if (src && typeof src === 'string' && src.trim()) {
      list.push(src.trim());
    }
    if (fallbackSrc && typeof fallbackSrc === 'string' && fallbackSrc.trim()) {
      if (!list.includes(fallbackSrc.trim())) list.push(fallbackSrc.trim());
    }
    additionalFallbacks.forEach((fb) => {
      if (fb && typeof fb === 'string' && fb.trim() && !list.includes(fb.trim())) {
        list.push(fb.trim());
      }
    });
    // Ultimate fallback: inline SVG data URI
    list.push(svgFallback);
    return list;
  }, [src, fallbackSrc, additionalFallbacks, svgFallback]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const triedUrlsRef = useRef<Set<string>>(new Set());

  // Reset index whenever primary src or candidate list changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsLoading(true);
    setIsLoaded(false);
    triedUrlsRef.current = new Set();
  }, [src, candidateList]);

  const activeSrc = candidateList[currentIndex] || svgFallback;

  // Pre-test image asynchronously in background to detect failures fast
  useEffect(() => {
    if (!activeSrc) return;

    // SVG data URIs load immediately and don't fail
    if (activeSrc.startsWith('data:image/svg+xml')) {
      setIsLoading(false);
      setIsLoaded(true);
      return;
    }

    let isMounted = true;
    const img = new Image();

    img.onload = () => {
      if (!isMounted) return;
      setIsLoading(false);
      setIsLoaded(true);
    };

    img.onerror = () => {
      if (!isMounted) return;
      triedUrlsRef.current.add(activeSrc);
      // Advance to next fallback
      setCurrentIndex((prev) => {
        const next = prev + 1;
        return next < candidateList.length ? next : candidateList.length - 1;
      });
    };

    img.src = activeSrc;

    return () => {
      isMounted = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [activeSrc, candidateList.length]);

  // DOM <img> onError callback as secondary safety net
  const onError = useCallback(() => {
    triedUrlsRef.current.add(activeSrc);
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
    setIsLoading(true);
    setIsLoaded(false);
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
