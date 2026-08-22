import { createClient } from "@supabase/supabase-js";

// FIXME:
export const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY,
);
