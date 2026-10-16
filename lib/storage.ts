import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { err, ok, type ApiResponse } from "@/lib/api-response";

// NOTE: The 'product-images' bucket must be created manually in the Supabase dashboard
// Dashboard > Storage > New bucket > name: product-images, public: true
const BUCKET = "product-images";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getStorageClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function uploadProductImage(
  file: File,
  productId: string
): Promise<ApiResponse<{ url: string; path: string }>> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return err("Invalid file type. Allowed: jpeg, png, webp, gif");
  }
  if (file.size > MAX_SIZE) {
    return err("File too large. Maximum 5 MB.");
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${productId}/${Date.now()}.${ext}`;

  const supabase = getStorageClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return err(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return ok({ url: data.publicUrl, path });
}

export async function deleteProductImage(path: string): Promise<ApiResponse<null>> {
  const supabase = getStorageClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) return err(error.message);
  return ok(null);
}

export function getPublicUrl(path: string): string {
  const supabase = getStorageClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
