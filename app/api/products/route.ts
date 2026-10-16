import { type NextRequest, NextResponse } from "next/server";
import { getProducts, createProduct } from "@/actions/products";
import { err } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const filters: Record<string, unknown> = {};
  for (const [key, value] of searchParams.entries()) {
    filters[key] = value;
  }
  const result = await getProducts(filters);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await createProduct(formData);
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (_e) {
    return NextResponse.json(err("Invalid request body"), { status: 400 });
  }
}
