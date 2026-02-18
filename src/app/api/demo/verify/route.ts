import { NextRequest, NextResponse } from "next/server";
import { getDemoPassword } from "@/lib/demo";

/**
 * Verify demo password. Returns a simple token (the password hash) stored in sessionStorage.
 */
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const expected = getDemoPassword();

    if (password === expected) {
      // Simple token — hash of password + date
      const token = Buffer.from(`demo:${expected}:${new Date().toISOString().split("T")[0]}`).toString("base64");
      return NextResponse.json({ data: { token }, error: null });
    }

    return NextResponse.json({ data: null, error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ data: null, error: "Invalid request" }, { status: 400 });
  }
}
