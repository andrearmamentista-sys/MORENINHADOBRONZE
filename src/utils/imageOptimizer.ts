/**
 * Image processing and auto-fit utility for uploaded photos
 * Guarantees that the ENTIRE photo is preserved without any cropping,
 * adjusting dimensions proportionally and maintaining crisp clarity.
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export const optimizeAndFitImage = (
  file: File,
  options: OptimizeImageOptions = {}
): Promise<string> => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.92,
  } = options;

  return new Promise((resolve, reject) => {
    // If not an image (e.g. PDF), read as raw data URL
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const finalQuality = options.quality ?? 0.85;
    const targetMaxWidth = options.maxWidth ?? 1200;
    const targetMaxHeight = options.maxHeight ?? 1200;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const rawDataUrl = readerEvent.target?.result as string;
      const img = new Image();
      img.onload = () => processCanvas(img, rawDataUrl);
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;

      function processCanvas(loadedImg: HTMLImageElement, fallbackUrl: string) {
        let width = loadedImg.width;
        let height = loadedImg.height;

        // Auto-fit calculation: preserve 100% of the original photo proportions
        if (width > targetMaxWidth || height > targetMaxHeight) {
          const ratio = Math.min(targetMaxWidth / width, targetMaxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fallbackUrl);
          return;
        }

        // Fill background for JPEGs
        if (outputMime === 'image/jpeg') {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(loadedImg, 0, 0, width, height);

        try {
          const resultUrl = canvas.toDataURL(outputMime, finalQuality);
          resolve(resultUrl);
        } catch {
          resolve(fallbackUrl);
        }
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
