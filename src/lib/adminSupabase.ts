import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
}

// For admin operations, we need to use service role to bypass RLS
// In production, this should be handled server-side for security
export const adminSupabase = createClient(supabaseUrl, supabaseServiceKey || import.meta.env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to check if we have admin access
export const hasAdminAccess = () => {
  const adminSession = localStorage.getItem('admin_session');
  if (!adminSession) return false;
  
  try {
    const session = JSON.parse(adminSession);
    return session.email === 'scc@gmail.com';
  } catch {
    return false;
  }
};