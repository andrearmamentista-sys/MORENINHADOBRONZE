/**
 * Supabase Client Initialization & Configuration for Moreninha do Bronze
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  SUPABASE_URL: 'moreninha_custom_supabase_url',
  SUPABASE_ANON_KEY: 'moreninha_custom_supabase_anon_key',
};

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

/**
 * Returns current Supabase credentials from environment or custom localStorage override
 */
export function getSupabaseCredentials(): { url: string; key: string; source: 'env' | 'custom' | 'none' } {
  // Check localStorage custom override first
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL)?.trim() || '';
    const customKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON_KEY)?.trim() || '';
    if (customUrl && customKey && isValidSupabaseUrl(customUrl)) {
      return { url: customUrl, key: customKey, source: 'custom' };
    }
  }

  // Check Vite environment variables
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (envUrl && envKey && isValidSupabaseUrl(envUrl) && !envUrl.includes('seu-projeto') && !envUrl.includes('your-project')) {
    return { url: envUrl, key: envKey, source: 'env' };
  }

  return { url: '', key: '', source: 'none' };
}

/**
 * Checks if a string looks like a valid Supabase project URL
 */
function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Checks if Supabase is properly configured and usable
 */
export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && isValidSupabaseUrl(url));
}

/**
 * Returns the Supabase client instance or null if not configured
 */
export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();

  if (!url || !key || !isValidSupabaseUrl(url)) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    lastUsedUrl = url;
    lastUsedKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Erro ao inicializar cliente Supabase:', err);
    return null;
  }
}

/**
 * Allows the salon admin to configure or test Supabase directly in the browser UI
 */
export function saveCustomSupabaseCredentials(url: string, key: string): boolean {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();

  if (!cleanUrl || !cleanKey || !isValidSupabaseUrl(cleanUrl)) {
    return false;
  }

  localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, cleanUrl);
  localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON_KEY, cleanKey);
  cachedClient = null; // Reset cached client to force re-initialization
  return true;
}

/**
 * Clears custom credentials
 */
export function clearCustomSupabaseCredentials(): void {
  localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
  localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON_KEY);
  cachedClient = null;
}
