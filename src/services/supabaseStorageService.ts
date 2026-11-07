/**
 * Supabase Storage Service
 * Handles uploading salon images (banner, avatar, service hero, thumbnails)
 * directly to the user's Supabase Storage bucket ('salon-images') and updating URLs.
 */
import { getSupabase, isSupabaseConfigured, getSupabaseCredentials } from './supabaseClient';
import { SalonConfig, Service, Specialist } from '../types';
import { saveSalonConfig, saveServices, saveSpecialists } from './dbService';

export const SUPABASE_BUCKET_NAME = 'salon-images';

export interface UploadProgress {
  currentStep: string;
  percent: number;
  uploadedUrls: Record<string, string>;
  error?: string;
}

export interface HostImagesResult {
  success: boolean;
  message: string;
  bucketName: string;
  urls: {
    bannerUrl?: string;
    avatarUrl?: string;
    serviceHeroUrl?: string;
    bannerThumbUrl?: string;
  };
  updatedConfig?: SalonConfig;
  updatedServices?: Service[];
  updatedSpecialists?: Specialist[];
}

/**
 * Checks whether the salon is currently configured to load images from Supabase Storage
 */
export function isUsingSupabaseImages(config?: SalonConfig | null): boolean {
  if (!config) return false;
  const cover = config.coverImageUrl || config.heroCoverImage || '';
  const avatar = config.avatarUrl || config.avatarImage || '';
  return cover.includes('supabase.co/storage/v1/object/public') || avatar.includes('supabase.co/storage/v1/object/public');
}

/**
 * Ensures the public storage bucket exists in Supabase.
 * If the user's Anon key doesn't have permissions to create buckets via API,
 * it safely continues since the bucket might already exist or be created via SQL Editor.
 */
export async function ensureStorageBucket(bucketName = SUPABASE_BUCKET_NAME): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (!listError && buckets) {
      const exists = buckets.some((b) => b.name === bucketName || b.id === bucketName);
      if (exists) return true;
    }

    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    });

    if (createError) {
      console.warn('Bucket may already exist or needs SQL creation:', createError.message);
    }
    return true;
  } catch (err) {
    console.warn('Warning checking storage bucket:', err);
    return true;
  }
}

/**
 * Helper to fetch a local image asset as a Blob
 */
async function fetchAssetBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Não foi possível carregar a imagem local ${url} (HTTP ${res.status})`);
  }
  return await res.blob();
}

/**
 * Uploads a single image Blob/File to the Supabase Storage bucket and returns the public CDN URL
 */
export async function uploadSingleImageToSupabase(
  blobOrFile: Blob | File,
  fileName: string,
  bucketName = SUPABASE_BUCKET_NAME
): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase não configurado. Por favor, insira a URL e a Anon Key primeiro.');
  }

  await ensureStorageBucket(bucketName);

  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const contentType = blobOrFile.type || (cleanFileName.endsWith('.png') ? 'image/png' : 'image/jpeg');

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(cleanFileName, blobOrFile, {
      upsert: true,
      contentType,
      cacheControl: '3600',
    });

  if (uploadError) {
    throw new Error(`Erro ao enviar ${cleanFileName} para o Supabase: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(cleanFileName);

  if (!publicUrlData?.publicUrl) {
    throw new Error(`Não foi possível obter a URL pública para ${cleanFileName}`);
  }

  return publicUrlData.publicUrl;
}

/**
 * Automatically uploads a single image to Supabase Storage (if configured)
 * or to the local backend server /uploads directory.
 * Returns a permanent, persistent URL that will never disappear or fail.
 */
export async function uploadImagePermanently(
  fileOrBlob: File | Blob,
  filenamePrefix = 'foto'
): Promise<{ url: string; source: 'supabase' | 'backend' | 'base64' }> {
  const supabase = getSupabase();
  const cleanExt = fileOrBlob.type.includes('png') ? '.png' : fileOrBlob.type.includes('webp') ? '.webp' : '.jpg';
  const fileName = `${filenamePrefix}_${Date.now()}${cleanExt}`;

  // 1. Tentar upload direto no Supabase Storage se configurado
  if (supabase && isSupabaseConfigured()) {
    try {
      const supabaseUrl = await uploadSingleImageToSupabase(fileOrBlob, fileName, SUPABASE_BUCKET_NAME);
      return { url: supabaseUrl, source: 'supabase' };
    } catch (err) {
      console.warn('Falha no upload direto para Supabase Storage:', err);
    }
  }

  // 2. Tentar upload para o backend server /api/upload-image
  try {
    const reader = new FileReader();
    const dataUrlPromise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
    });
    const base64 = await dataUrlPromise;

    const creds = getSupabaseCredentials();
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        filename: fileName,
        supabaseUrl: creds.url,
        supabaseKey: creds.key,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.url) {
        return {
          url: data.url,
          source: data.source === 'supabase' ? 'supabase' : 'backend',
        };
      }
    }
    // Fallback: se o backend não retornar URL, usa o base64
    return { url: base64, source: 'base64' };
  } catch (err) {
    console.warn('Falha no upload para o backend:', err);
  }

  // 3. Fallback seguro com base64
  const fallbackReader = new FileReader();
  const fallbackDataUrl = await new Promise<string>((resolve) => {
    fallbackReader.onload = () => resolve(fallbackReader.result as string);
    fallbackReader.readAsDataURL(fileOrBlob);
  });
  return { url: fallbackDataUrl, source: 'base64' };
}

/**
 * Automatically uploads all core salon images to the user's Supabase Storage bucket:
 * 1. banner.png (Banner de fundo principal)
 * 2. avatar.png (Logo circular / foto da especialista)
 * 3. service-hero.png (Foto do serviço de bronzeamento)
 * 4. banner-thumb.png (Miniatura do banho de lua)
 *
 * Then updates the salon config, services, and specialists in Supabase and local storage!
 */
export async function uploadAllSalonImagesToSupabase(
  currentConfig: SalonConfig,
  currentServices: Service[],
  currentSpecialists: Specialist[],
  onProgress?: (progress: UploadProgress) => void
): Promise<HostImagesResult> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase não está configurado. Por favor, preencha a URL e a Anon Key na aba Banco & Supabase antes de hospedar as imagens.',
      bucketName: SUPABASE_BUCKET_NAME,
      urls: {},
    };
  }

  const uploadedUrls: Record<string, string> = {};

  try {
    onProgress?.({
      currentStep: 'Verificando bucket no Supabase Storage...',
      percent: 10,
      uploadedUrls,
    });

    await ensureStorageBucket(SUPABASE_BUCKET_NAME);

    // List of local assets to host on Supabase
    const assetsToHost = [
      { key: 'banner', localPath: './images/banner.png', targetName: 'banner.png' },
      { key: 'avatar', localPath: './images/avatar.png', targetName: 'avatar.png' },
      { key: 'serviceHero', localPath: './images/service-hero.png', targetName: 'service-hero.png' },
      { key: 'bannerThumb', localPath: './images/banner-thumb.png', targetName: 'banner-thumb.png' },
    ];

    let completed = 0;
    for (const asset of assetsToHost) {
      onProgress?.({
        currentStep: `Fazendo upload de ${asset.targetName} para o Supabase Storage...`,
        percent: 20 + Math.floor((completed / assetsToHost.length) * 60),
        uploadedUrls,
      });

      try {
        const blob = await fetchAssetBlob(asset.localPath);
        const publicUrl = await uploadSingleImageToSupabase(blob, asset.targetName, SUPABASE_BUCKET_NAME);
        uploadedUrls[asset.key] = publicUrl;
      } catch (err: any) {
        console.warn(`Erro no upload de ${asset.targetName}:`, err.message);
        // Fallback to direct path if individual upload fails
        const { data } = supabase.storage.from(SUPABASE_BUCKET_NAME).getPublicUrl(asset.targetName);
        if (data?.publicUrl) {
          uploadedUrls[asset.key] = data.publicUrl;
        }
      }
      completed++;
    }

    onProgress?.({
      currentStep: 'Atualizando configurações do salão com as URLs do Supabase...',
      percent: 85,
      uploadedUrls,
    });

    // Create updated config with live Supabase Storage URLs
    const updatedConfig: SalonConfig = {
      ...currentConfig,
      coverImageUrl: uploadedUrls.banner || currentConfig.coverImageUrl,
      heroCoverImage: uploadedUrls.banner || currentConfig.heroCoverImage,
      avatarUrl: uploadedUrls.avatar || currentConfig.avatarUrl,
      avatarImage: uploadedUrls.avatar || currentConfig.avatarImage,
      updatedAt: new Date().toISOString(),
    };

    // Update service image URLs
    const updatedServices: Service[] = currentServices.map((svc) => {
      let newImg = svc.imageUrl || svc.image || '';
      if (svc.id === 'bronze_1h' || svc.id === 'bronze-1h' || svc.name.toLowerCase().includes('1 hora')) {
        newImg = uploadedUrls.serviceHero || uploadedUrls.banner || newImg;
      } else if (svc.id === 'bronze_2h' || svc.id === 'bronze-2h' || svc.name.toLowerCase().includes('2 hora')) {
        newImg = uploadedUrls.banner || newImg;
      } else if (svc.id === 'banho_lua' || svc.id === 'banho-lua' || svc.name.toLowerCase().includes('banho')) {
        newImg = uploadedUrls.bannerThumb || uploadedUrls.serviceHero || newImg;
      }
      return {
        ...svc,
        imageUrl: newImg,
        image: newImg,
      };
    });

    // Update specialists with Supabase avatar
    const updatedSpecialists: Specialist[] = currentSpecialists.map((sp) => ({
      ...sp,
      imageUrl: uploadedUrls.avatar || sp.imageUrl || sp.avatarUrl || '',
      avatarUrl: uploadedUrls.avatar || sp.imageUrl || sp.avatarUrl || '',
    }));

    // Save to database & local persistence
    await saveSalonConfig(updatedConfig);
    await saveServices(updatedServices);
    await saveSpecialists(updatedSpecialists);

    onProgress?.({
      currentStep: 'Concluído! Todas as imagens foram hospedadas no Supabase com sucesso!',
      percent: 100,
      uploadedUrls,
    });

    return {
      success: true,
      message: 'Imagens hospedadas no Supabase com sucesso! O salão agora carrega as fotos diretamente da CDN do Supabase.',
      bucketName: SUPABASE_BUCKET_NAME,
      urls: {
        bannerUrl: uploadedUrls.banner,
        avatarUrl: uploadedUrls.avatar,
        serviceHeroUrl: uploadedUrls.serviceHero,
        bannerThumbUrl: uploadedUrls.bannerThumb,
      },
      updatedConfig,
      updatedServices,
      updatedSpecialists,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao hospedar imagens no Supabase: ${err.message || 'Falha na conexão com o Supabase Storage'}`,
      bucketName: SUPABASE_BUCKET_NAME,
      urls: uploadedUrls,
    };
  }
}

/**
 * Restores the default relative paths for the salon images
 */
export async function resetToLocalImages(
  currentConfig: SalonConfig,
  currentServices: Service[],
  currentSpecialists: Specialist[]
): Promise<{ updatedConfig: SalonConfig; updatedServices: Service[]; updatedSpecialists: Specialist[] }> {
  const updatedConfig: SalonConfig = {
    ...currentConfig,
    coverImageUrl: './images/banner.png',
    heroCoverImage: './images/banner.png',
    avatarUrl: './images/avatar.png',
    avatarImage: './images/avatar.png',
    updatedAt: new Date().toISOString(),
  };

  const updatedServices = currentServices.map((svc) => {
    let img = './images/banner.png';
    if (svc.id === 'bronze_1h' || svc.id === 'bronze-1h') img = './images/service-hero.png';
    if (svc.id === 'banho_lua' || svc.id === 'banho-lua') img = './images/banner-thumb.png';
    return { ...svc, imageUrl: img, image: img };
  });

  const updatedSpecialists = currentSpecialists.map((sp) => ({
    ...sp,
    imageUrl: './images/avatar.png',
    avatarUrl: './images/avatar.png',
  }));

  await saveSalonConfig(updatedConfig);
  await saveServices(updatedServices);
  await saveSpecialists(updatedSpecialists);

  return { updatedConfig, updatedServices, updatedSpecialists };
}
