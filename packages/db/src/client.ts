import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let supabaseInstance: SupabaseClient | null = null;

export interface SupabaseConfig {
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  supabaseAnonKey?: string;
  encryptionKey?: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  return {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    encryptionKey: process.env.SUPABASE_DB_ENCRYPTION_KEY || 'rea-super-secret-development-key-2026',
  };
}

/**
 * Returns a configured Supabase client using the Service Role Key for backend administrative operations
 * (such as decrypting tokens and inserting audit logs).
 */
export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();

  if (!config.supabaseUrl || (!config.supabaseServiceRoleKey && !config.supabaseAnonKey)) {
    return null;
  }

  if (!supabaseInstance) {
    const key = config.supabaseServiceRoleKey || config.supabaseAnonKey!;
    supabaseInstance = createClient(config.supabaseUrl, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseInstance;
}

/**
 * Checks whether Supabase connection parameters are provided.
 */
export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config.supabaseUrl && (config.supabaseServiceRoleKey || config.supabaseAnonKey));
}
