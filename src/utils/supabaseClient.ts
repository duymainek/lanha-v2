import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User as AppUser } from '../data/types'; // Our application's User type

// IMPORTANT:
// The Supabase URL and Anonymous Key must be set as environment variables.
// - process.env.SUPABASE_URL
// - process.env.SUPABASE_ANON_KEY
// Ensure that SUPABASE_ANON_KEY is the public anonymous key from your Supabase project settings (API section),
// NOT a service_role key. Using a service_role key on the client-side is a major security risk.


let supabaseInstance: SupabaseClient;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error( // Changed to console.error
    'CRITICAL ERROR: Supabase URL and/or Anon Key are not configured in environment variables. ' +
    'Application will not function correctly. Ensure process.env.SUPABASE_URL and process.env.SUPABASE_ANON_KEY are set. ' +
    'THE ANON KEY MUST BE THE PUBLIC ANONYMOUS KEY.'
  );
  // If Supabase is absolutely critical and the app cannot run without it,
  // you might consider throwing an error here to halt execution:
  // throw new Error("Supabase configuration missing. Application cannot start.");
  // For now, we'll allow the app to load but Supabase calls will fail.
}

// Initialize Supabase client.
// If SUPABASE_URL or SUPABASE_ANON_KEY are undefined, createClient will handle this,
// typically by creating a client that will error on operations.
// Using non-null assertion operator (!) because we've made it clear these are critical.
// If they are indeed missing, `createClient` will likely error or create a non-functional client.
supabaseInstance = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

export const supabase = supabaseInstance;

// This mapSupabaseUserToAppUser function is related to Supabase auth.
// The current AuthContext uses mock authentication, so this function might not be actively used
// unless you switch AuthContext to use Supabase.
export const mapSupabaseUserToAppUser = (supabaseUser: any | null): AppUser | null => {
    // The check for SUPABASE_URL/KEY is no longer needed here as the client init would have failed or warned.
    if (!supabaseUser) return null;
    return {
        id: supabaseUser.id || 'mock-id', // Fallback for safety if properties are missing
        email: supabaseUser.email || 'mock@example.com',
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
        role: 'Admin', // Defaulting role, adjust as per your Supabase user roles
    };
};