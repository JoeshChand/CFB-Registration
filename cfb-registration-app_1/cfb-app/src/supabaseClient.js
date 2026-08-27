import { createClient } from "@supabase/supabase-js";

// These come from your Supabase project → Settings → API.
// Set them in a .env file locally (see .env.example) and as
// environment variables in Vercel when you deploy.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars are missing. Copy .env.example to .env and fill in your project URL + anon key."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

// Uploads a photo (as a File) to the "photos" bucket and returns its
// public URL. Used for player/manager photos and the endorsement page.
export async function uploadPhoto(file, pathPrefix) {
  const ext = file.name.split(".").pop();
  const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("photos").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  return data.publicUrl;
}
