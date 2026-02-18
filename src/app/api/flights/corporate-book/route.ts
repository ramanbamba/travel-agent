import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupplyBooking } from "@/lib/supply";
import { sendTextMessage } from "@/lib/whatsapp/client";
import {
  formatBookingConfirmation,
  formatApprovalRequest,
} from "@/lib/whatsapp/formatters";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;

interface BookRequest {
  offer_id: string;
  member_id: string;
  org_id: string;
  purpose?: string;
  purpose_note?: string;
  project_code?: string;
  cost_center?: string;
  booking_channel: "whatsapp" | "web" | "admin_booked";
  // Passenger details pulled from member if not provided
  passenger?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
  };
  // Pre-parsed flight details for corp_booking record
  flight_details: {
    origin: string;
    destination: string;
    departure_date: string;
    cabin_class: string;
    airline_code?: string;
    airline_name?: string;
    total_amount: number;
    currency: string;
  };
  // Policy compliance from search step
  policy_compliant: boolean;
  policy_violations: string[];
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
    const body: BookRequest = await req.json();
    const {
      offer_id, member_id, org_id, purpose, purpose_note,
      project_code, cost_center, booking_channel,
      flight_details, policy_compliant, policy_violations,
    } = body;

    if (!offer_id || !member_id || !org_id || !flight_details) {
      return NextResponse.json(
        { data: null, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Load policy + member + org in parallel
    const db = supabase as DbRow;
    const [policyResult, memberResult, orgResult] = await Promise.all([
      db.from("travel_policies").select("*").eq("org_id", org_id).eq("is_active", true).limit(1).single(),
      db.from("org_members").select("*").eq("id", member_id).single(),
      db.from("organizations").select("gstin, gst_state_code, default_currency").eq("id", org_id).single(),
    ]);

    const policy = policyResult.data;
    const member = memberResult.data;
    const org = orgResult.data;
    const approvalRules = policy?.approval_rules ?? {};
    const amount = flight_details.total_amount;

    // Determine if approval is needed
    const autoApproveUnder = approvalRules.auto_approve_under ?? 0;
    const requireApprovalOver = approvalRules.require_approval_over ?? 10000;
    const needsApproval =
      !policy_compliant ||
      (amount > requireApprovalOver) ||
      (autoApproveUnder > 0 && amount >= autoApproveUnder && !policy_compliant);

    const approvalStatus = needsApproval ? "pending" : "auto_approved";
    const bookingStatus = needsApproval ? "pending_approval" : "booked";
    const pnr = needsApproval ? null : generatePNR();

    // Create corp_booking record
    const { data: booking, error: bookingError } = await db.from("corp_bookings")
      .insert({
        org_id,
        member_id,
        booked_by: member_id,
        trip_type: flight_details.departure_date ? "one_way" : "one_way",
        purpose: purpose ?? null,
        purpose_note: purpose_note ?? null,
        project_code: project_code ?? null,
        cost_center: cost_center ?? null,
        booking_channel,
        pnr,
        status: bookingStatus,
        flight_details: { offer_id, ...flight_details },
        origin: flight_details.origin,
        destination: flight_details.destination,
        departure_date: flight_details.departure_date,
        cabin_class: flight_details.cabin_class,
        airline_code: flight_details.airline_code ?? null,
        airline_name: flight_details.airline_name ?? null,
        policy_compliant,
        policy_violations: policy_violations.map((v) => ({ rule: "policy", message: v })),
        total_amount: amount,
        currency: flight_details.currency || "INR",
        approval_status: approvalStatus,
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      console.error("[Corporate Book] DB error:", bookingError);
      return NextResponse.json(
        { data: null, error: "Failed to create booking" },
        { status: 500 }
      );
    }

    // ── Approval Flow ──
    if (needsApproval) {
      // Find approver (reports_to or any travel_manager)
      let approverId = member?.reports_to;
      if (!approverId) {
        const { data: tm } = await db.from("org_members")
          .select("id")
          .eq("org_id", org_id)
          .in("role", ["travel_manager", "admin"])
          .eq("status", "active")
          .limit(1)
          .single();
        approverId = tm?.id;
      }

      if (approverId) {
        // Create approval request
        await db.from("approval_requests").insert({
          org_id,
          booking_id: booking.id,
          requester_id: member_id,
          approver_id: approverId,
          status: "pending",
          message: policy_violations.length > 0
            ? `Policy violations: ${policy_violations.join(", ")}`
            : `Amount ₹${amount.toLocaleString("en-IN")} requires approval`,
          notified_via: "whatsapp",
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

        // Notify approver via WhatsApp
        const { data: approverData } = await db.from("org_members")
          .select("phone, full_name")
          .eq("id", approverId)
          .single();

        if (approverData?.phone) {
          const approvalMsg = formatApprovalRequest({
            requesterName: member?.full_name ?? "Employee",
            origin: flight_details.origin,
            destination: flight_details.destination,
            departureDate: flight_details.departure_date,
            airline: flight_details.airline_name ?? null,
            totalAmount: amount,
            currency: flight_details.currency || "INR",
            policyViolations: policy_violations,
          });
          await sendTextMessage(approverData.phone, approvalMsg);
        }
      }

      // Notify requester
      if (member?.phone) {
        const confirmMsg = formatBookingConfirmation({
          pnr: null,
          origin: flight_details.origin,
          destination: flight_details.destination,
          departureDate: flight_details.departure_date,
          departureTime: "",
          arrivalTime: "",
          airline: flight_details.airline_name ?? flight_details.airline_code ?? "",
          flightNumber: "",
          cabin: flight_details.cabin_class,
          totalAmount: amount,
          currency: flight_details.currency || "INR",
          status: "pending_approval",
          passengerName: member.full_name,
          approvalStatus: "pending",
        });
        await sendTextMessage(member.phone, confirmMsg);
      }

      return NextResponse.json({
        data: {
          booking_id: booking.id,
          status: "pending_approval",
          message: "Booking sent for approval",
        },
        error: null,
      });
    }

    // ── Auto-Approved: Execute Booking ──
    let duffelOrderId: string | null = null;
    let supplierBookingId: string | null = null;

    try {
      // Build passenger from member data
      const nameParts = (member?.full_name ?? "Test User").split(" ");
      const passenger = body.passenger ?? {
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(" ") || nameParts[0],
        email: member?.email ?? "booking@skyswift.ai",
        phone: member?.phone ?? undefined,
      };

      const supplyBooking = await createSupplyBooking(
        offer_id,
        [{
          firstName: passenger.first_name,
          lastName: passenger.last_name,
          email: passenger.email,
          phone: passenger.phone,
          dateOfBirth: body.passenger?.date_of_birth,
        }],
        {
          type: "duffel_balance",
          currency: flight_details.currency || "INR",
          amount,
        }
      );

      duffelOrderId = supplyBooking.supplierBookingId;
      supplierBookingId = supplyBooking.id;

      // Update corp_booking with supplier details
      await db.from("corp_bookings")
        .update({
          duffel_order_id: duffelOrderId,
          pnr: supplyBooking.confirmationCode || pnr,
          status: "booked",
        })
        .eq("id", booking.id);
    } catch (supplyErr) {
      console.error("[Corporate Book] Supply error:", supplyErr);
      // Booking record exists but supply failed — mark as pending
      await db.from("corp_bookings")
        .update({ status: "pending" })
        .eq("id", booking.id);
    }

    // Create GST invoice if org has GSTIN
    if (org?.gstin) {
      const gstRate = 0.05; // 5% GST on air travel
      const baseAmount = amount / (1 + gstRate);
      const totalGst = amount - baseAmount;
      const isInterstate = org.gst_state_code !== getStateFromAirport(flight_details.origin);

      await db.from("gst_invoices").insert({
        org_id,
        booking_id: booking.id,
        vendor_name: flight_details.airline_name ?? "Airline",
        vendor_gstin: null, // Airline GSTIN would come from a lookup
        base_amount: Math.round(baseAmount),
        cgst_amount: isInterstate ? 0 : Math.round(totalGst / 2),
        sgst_amount: isInterstate ? 0 : Math.round(totalGst / 2),
        igst_amount: isInterstate ? Math.round(totalGst) : 0,
        total_gst: Math.round(totalGst),
        total_amount: Math.round(amount),
        itc_eligible: true,
        sac_code: "996411", // SAC code for air transport
        source: "auto",
      });
    }

    // Update traveler preferences (increment booking count)
    const { data: currentPrefs } = await db.from("traveler_preferences")
      .select("total_bookings")
      .eq("member_id", member_id)
      .single();

    if (currentPrefs) {
      await db.from("traveler_preferences")
        .update({
          total_bookings: (currentPrefs.total_bookings ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("member_id", member_id);
    }

    // Send WhatsApp confirmation
    if (member?.phone) {
      const finalPnr = duffelOrderId ? (pnr ?? generatePNR()) : pnr;
      const confirmMsg = formatBookingConfirmation({
        pnr: finalPnr,
        origin: flight_details.origin,
        destination: flight_details.destination,
        departureDate: flight_details.departure_date,
        departureTime: "",
        arrivalTime: "",
        airline: flight_details.airline_name ?? flight_details.airline_code ?? "",
        flightNumber: "",
        cabin: flight_details.cabin_class,
        totalAmount: amount,
        currency: flight_details.currency || "INR",
        status: "booked",
        passengerName: member.full_name,
      });
      await sendTextMessage(member.phone, confirmMsg);

      // Send PDF confirmation if available (placeholder URL — P4-06 PDF generation)
      // PDF will be generated and hosted in a future step
    }

    return NextResponse.json({
      data: {
        booking_id: booking.id,
        status: "booked",
        pnr,
        duffel_order_id: duffelOrderId,
        supplier_booking_id: supplierBookingId,
      },
      error: null,
    });
  } catch (error) {
    console.error("[Corporate Book] Error:", error);
    return NextResponse.json(
      { data: null, error: "Booking failed" },
      { status: 500 }
    );
  }
}

// Helper: map airport code to GST state code (simplified)
function getStateFromAirport(code: string): string | null {
  const map: Record<string, string> = {
    DEL: "07", BOM: "27", BLR: "29", HYD: "36", MAA: "33",
    CCU: "19", PNQ: "27", AMD: "24", GOI: "30", JAI: "08",
    LKO: "09", COK: "32",
  };
  return map[code] ?? null;
}
