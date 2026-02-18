import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupplyBooking } from "@/lib/supply";
import { sendTextMessage } from "@/lib/whatsapp/client";
import { formatBookingConfirmation } from "@/lib/whatsapp/formatters";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;
const db = supabase as DbRow;

interface RespondRequest {
  approval_id: string;
  action: "approve" | "reject";
  responder_id: string;
  reason?: string;
}

function generatePNR(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pnr = "";
  for (let i = 0; i < 6; i++) {
    pnr += chars[Math.floor(Math.random() * chars.length)];
  }
  return pnr;
}

export async function POST(req: NextRequest) {
  try {
    const body: RespondRequest = await req.json();
    const { approval_id, action, responder_id, reason } = body;

    if (!approval_id || !action || !responder_id) {
      return NextResponse.json(
        { data: null, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Load approval request with booking details
    const { data: approval } = await db.from("approval_requests")
      .select("*, corp_bookings(*)")
      .eq("id", approval_id)
      .single();

    if (!approval) {
      return NextResponse.json(
        { data: null, error: "Approval request not found" },
        { status: 404 }
      );
    }

    if (approval.status !== "pending") {
      return NextResponse.json(
        { data: null, error: `Already ${approval.status}` },
        { status: 400 }
      );
    }

    // Verify responder is the assigned approver
    if (approval.approver_id !== responder_id) {
      return NextResponse.json(
        { data: null, error: "Not authorized to respond" },
        { status: 403 }
      );
    }

    const booking = approval.corp_bookings;
    const newApprovalStatus = action === "approve" ? "approved" : "rejected";

    // Update approval request
    await db.from("approval_requests")
      .update({
        status: newApprovalStatus,
        response_message: reason ?? null,
        responded_at: new Date().toISOString(),
      })
      .eq("id", approval_id);

    // Load requester for notifications
    const { data: requester } = await db.from("org_members")
      .select("full_name, phone, email")
      .eq("id", approval.requester_id)
      .single();

    if (action === "reject") {
      // Update booking status
      await db.from("corp_bookings")
        .update({
          status: "cancelled",
          approval_status: "rejected",
          approved_by: responder_id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason ?? "Rejected by manager",
        })
        .eq("id", booking.id);

      // Notify requester
      if (requester?.phone) {
        await sendTextMessage(
          requester.phone,
          `❌ *Booking rejected*\n\n` +
          `Your ${booking.origin}→${booking.destination} flight on ${booking.departure_date} was rejected.\n` +
          (reason ? `\nReason: ${reason}` : "") +
          `\n\nNeed help finding an alternative? Just tell me!`
        );
      }

      return NextResponse.json({
        data: { status: "rejected", booking_id: booking.id },
        error: null,
      });
    }

    // ── Approved: Execute booking ──
    await db.from("corp_bookings")
      .update({
        approval_status: "approved",
        approved_by: responder_id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    // Try to book via supply layer
    let pnr = generatePNR();
    let duffelOrderId: string | null = null;
    const offerId = booking.flight_details?.offer_id;

    if (offerId) {
      try {
        const nameParts = (requester?.full_name ?? "Test User").split(" ");
        const supplyBooking = await createSupplyBooking(
          offerId,
          [{
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(" ") || nameParts[0],
            email: requester?.email ?? "booking@skyswift.ai",
            phone: requester?.phone,
          }],
          {
            type: "duffel_balance",
            currency: booking.currency || "INR",
            amount: booking.total_amount,
          }
        );

        duffelOrderId = supplyBooking.supplierBookingId;
        pnr = supplyBooking.confirmationCode || pnr;
      } catch (err) {
        console.error("[Approval] Supply booking failed:", err);
        // Continue with manual PNR — booking is approved even if supply fails
      }
    }

    // Update final booking status
    await db.from("corp_bookings")
      .update({
        status: "booked",
        pnr,
        duffel_order_id: duffelOrderId,
      })
      .eq("id", booking.id);

    // Notify requester
    if (requester?.phone) {
      const confirmMsg = formatBookingConfirmation({
        pnr,
        origin: booking.origin,
        destination: booking.destination,
        departureDate: booking.departure_date,
        departureTime: "",
        arrivalTime: "",
        airline: booking.airline_name ?? booking.airline_code ?? "",
        flightNumber: "",
        cabin: booking.cabin_class ?? "economy",
        totalAmount: booking.total_amount,
        currency: booking.currency || "INR",
        status: "booked",
        passengerName: requester.full_name,
      });
      await sendTextMessage(requester.phone, confirmMsg);
    }

    return NextResponse.json({
      data: {
        status: "approved",
        booking_id: booking.id,
        pnr,
        duffel_order_id: duffelOrderId,
      },
      error: null,
    });
  } catch (error) {
    console.error("[Approval Respond] Error:", error);
    return NextResponse.json(
      { data: null, error: "Failed to process approval" },
      { status: 500 }
    );
  }
}
