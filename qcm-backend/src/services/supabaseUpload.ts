import { supabase } from "../config/supabase";

export async function uploadToSupabase(file: Buffer, fileName: string) {
  const bucket = process.env.SUPABASE_BUCKET!;

  const path = `uploads/${Date.now()}_${fileName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    publicUrl: data.publicUrl,
    path,   // 🔥 on retourne le vrai chemin
  };
}
