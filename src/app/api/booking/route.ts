import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { data: null, error: "Not implemented", message: "Booking endpoint placeholder" },
    { status: 501 }
  );
}
