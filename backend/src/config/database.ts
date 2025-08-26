import { DatabaseConfig } from '@/types';


export const config:DatabaseConfig={
    supabaseUrl:process.env.SUPABASE_URL || "",
    supabaseAnonKey:process.env.SUPABASE_ANON_KEY || "",
    supabaseServiceKey:process.env.SUPABASE_SERVICE_KEY || ""
};

// Validate required environment variables
export function validateDatabaseConfig(): void {
    const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }