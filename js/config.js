// Isi URL, Publishable/anon key, dan UID admin. Jangan gunakan service_role/secret key.
window.SUPABASE_URL="https://ppiwymzzohlqcxcqnelu.supabase.co";
window.SUPABASE_PUBLISHABLE_KEY="sb_publishable_c_fFqWlLp-_HMdpbybzIdw_uJRp55bR";
window.ADMIN_UID="cf0cfa20-647f-48bb-a682-78ebbd0ee223";
if(window.supabase && !window.SUPABASE_URL.includes("PROJECT-REF") && !window.SUPABASE_PUBLISHABLE_KEY.includes("PASTE_") && !window.ADMIN_UID.includes("PASTE_")) window.db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_PUBLISHABLE_KEY);
