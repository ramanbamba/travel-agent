import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

/**
 * Shared API response helpers for consistent JSON formatting.
 * Usage:
 *   return success(data, "Bookings fetched");
 *   return error("Unauthorized", 401);
 *   return unauthorized();
 */

export function success<T>(data: T, message = "OK"): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, error: null, message });
}

export function error(
  msg: string,
  status = 500,
  code?: string
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    { data: null, error: code ?? msg, message: msg },
    { status }
  );
}

export function unauthorized(msg = "You must be logged in"): NextResponse<ApiResponse<null>> {
  return error(msg, 401, "Unauthorized");
}

export function forbidden(msg = "Insufficient permissions"): NextResponse<ApiResponse<null>> {
  return error(msg, 403, "Forbidden");
}

export function notFound(msg = "Not found"): NextResponse<ApiResponse<null>> {
  return error(msg, 404, "Not found");
}

export function badRequest(msg = "Bad request"): NextResponse<ApiResponse<null>> {
  return error(msg, 400, "Bad request");
}
