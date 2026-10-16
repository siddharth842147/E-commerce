import { type NextRequest, NextResponse } from "next/server";
import { getCategories, createCategory } from "@/actions/categories";
import { err } from "@/lib/api-response";

export async function GET() {
  const result = await getCategories();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createCategory(formData);
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (_e) {
    return NextResponse.json(err("Invalid request body"), { status: 400 });
  }
}
