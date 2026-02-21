import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { cancelSupplyBooking, resolveSupplierFromOfferId } from "@/lib/supply";
import { sendTextMessage } from "@/lib/whatsapp/client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;
const db = supabase as DbRow;

interface CancelRequest {
  booking_id: string;
  member_id: string;
  reason?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Verify caller is authenticated
    const authClient = createServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body: CancelRequest = await req.json();
    const { booking_id, member_id, reason } = body;

    if (!booking_id || !member_id) {
      return NextResponse.json(
        { data: null, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Load booking
    const { data: booking } = await db.from("corp_bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { data: null, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify member owns the booking or is admin/TM
    if (booking.member_id !== member_id) {
      const { data: requester } = await db.from("org_members")
        .select("role")
        .eq("id", member_id)
        .single();

      if (!requester || !["admin", "travel_manager"].includes(requester.role)) {
        return NextResponse.json(
          { data: null, error: "Not authorized to cancel" },
          { status: 403 }
        );
      }
    }

    // Can only cancel booked or approved bookings
    if (!["booked", "approved", "pending_approval"].includes(booking.status)) {
      return NextResponse.json(
        { data: null, error: `Cannot cancel booking with status: ${booking.status}` },
        { status: 400 }
      );
    }

    let refundAmount: number | undefined;
    let refundMessage: string | undefined;

    // Cancel via supply layer if we have a Duffel order
    if (booking.duffel_order_id) {
      try {
        const supplierId = booking.duffel_order_id;
        const supplierName = resolveSupplierFromOfferId(`duffel-${supplierId}`);
        const result = await cancelSupplyBooking(supplierName, supplierId);
        refundAmount = result.refundAmount;
        refundMessage = result.message;
      } catch (err) {
        console.error("[Corporate Cancel] Supply cancellation failed:", err);
        // Continue with DB update even if supply cancel fails
      }
    }

    // Update booking status
    await db.from("corp_bookings")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking_id);

    // Cancel any pending approval requests
    await db.from("approval_requests")
      .update({ status: "expired" })
      .eq("booking_id", booking_id)
      .eq("status", "pending");

    // Notify member via WhatsApp
    const { data: member } = await db.from("org_members")
      .select("phone, full_name")
      .eq("id", booking.member_id)
      .single();

    if (member?.phone) {
      let msg = `❌ *Booking cancelled*\n\n`;
      msg += `${booking.origin}→${booking.destination} on ${booking.departure_date}`;
      if (booking.pnr) msg += ` · PNR: ${booking.pnr}`;
      msg += `\n`;
      if (reason) msg += `\nReason: ${reason}`;
      if (refundAmount) {
        msg += `\n💰 Refund: ₹${Math.round(refundAmount).toLocaleString("en-IN")}`;
      }
      if (refundMessage) msg += `\n${refundMessage}`;
      msg += `\n\nNeed to rebook? Just tell me where you need to go!`;

      await sendTextMessage(member.phone, msg);
    }

    return NextResponse.json({
      data: {
        booking_id,
        status: "cancelled",
        refund_amount: refundAmount,
        refund_message: refundMessage,
      },
      error: null,
    });
  } catch (error) {
    console.error("[Corporate Cancel] Error:", error);
    return NextResponse.json(
      { data: null, error: "Cancellation failed" },
      { status: 500 }
    );
  }
}
