import { type NextRequest, NextResponse } from "next/server";
import { uploadProductImage } from "@/lib/storage";
import { requireAdmin } from "@/lib/auth";
import { err } from "@/lib/api-response";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(err("No image provided"), { status: 400 });
    }

    const upload = await uploadProductImage(file, id);
    if (!upload.success) {
      return NextResponse.json(upload, { status: 400 });
    }

    await db
      .update(categories)
      .set({ imageUrl: upload.data.url })
      .where(eq(categories.id, id));

    return NextResponse.json(upload, { status: 200 });
  } catch (_e) {
    return NextResponse.json(err("Failed to upload image"), { status: 500 });
  }
}
