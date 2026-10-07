import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://imvgzyyguuheryqiummd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_OaYKGwrAdI3150jn1btrTQ_msMIZisK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
