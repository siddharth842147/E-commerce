import { type NextRequest, NextResponse } from "next/server";
import { getProductDetail } from "@/actions/products";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const result = await getProductDetail(slug);
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}
