import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { data: null, error: "Not implemented", message: "Flight search endpoint placeholder" },
    { status: 501 }
  );
}
