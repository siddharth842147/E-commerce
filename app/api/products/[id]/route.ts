import { type NextRequest, NextResponse } from "next/server";
import { updateProduct, deleteProduct } from "@/actions/products";
import { err } from "@/lib/api-response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const result = await updateProduct(id, formData);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (_e) {
    return NextResponse.json(err("Invalid request"), { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await deleteProduct(id);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
