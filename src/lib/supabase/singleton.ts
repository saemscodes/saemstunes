// Redirection to the canonical Supabase client singleton
// This ensures that only one instance of GoTrueClient exists.
export { supabase, getSupabaseClient } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';
export default supabase;
