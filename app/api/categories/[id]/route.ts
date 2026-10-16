import { type NextRequest, NextResponse } from "next/server";
import { updateCategory, deleteCategory } from "@/actions/categories";
import { err } from "@/lib/api-response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const result = await updateCategory(id, formData);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (_e) {
    return NextResponse.json(err("Invalid request"), { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteCategory(id);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (_e) {
    return NextResponse.json(err("Internal server error"), { status: 500 });
  }
}
