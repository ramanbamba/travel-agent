// ============================================================================
// WhatsApp Message Formatters
// Format flight results, bookings, approvals for WhatsApp display
// ============================================================================

import type { FlightOffer, SupplyFlightSegment } from "@/lib/supply/types";

// ── Types ──

export interface PolicyCompliance {
  status: "compliant" | "warning" | "blocked";
  violations: string[];
}

export interface CorporateFlightResult {
  offer: FlightOffer;
  compliance: PolicyCompliance;
  preferenceScore?: number;
}

interface BookingSummary {
  pnr: string | null;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  cabin: string;
  totalAmount: number;
  currency: string;
  status: string;
  passengerName: string;
  approvalStatus?: string;
}

interface ApprovalRequestSummary {
  requesterName: string;
  origin: string;
  destination: string;
  departureDate: string;
  airline: string | null;
  totalAmount: number;
  currency: string;
  policyViolations: string[];
}

// ── Helpers ──

function formatTime(isoTime: string): string {
  const d = new Date(isoTime);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatPrice(amount: number, currency: string): string {
  if (currency === "INR") {
    return `₹${Math.round(amount).toLocaleString("en-IN")}`;
  }
  return `${currency} ${amount.toFixed(2)}`;
}

function formatSegmentLine(seg: SupplyFlightSegment): string {
  const dep = formatTime(seg.departure.time);
  const arr = formatTime(seg.arrival.time);
  return `${seg.airlineCode} ${seg.flightNumber} · ${dep}–${arr} · ${seg.duration}`;
}

// ── Formatters ──

/**
 * Format flight search results as a numbered WhatsApp message.
 * Shows top results with pricing, timing, and policy compliance.
 */
export function formatFlightResults(
  results: CorporateFlightResult[],
  origin: string,
  destination: string,
  date: string
): string {
  if (results.length === 0) {
    return `No flights found for ${origin}→${destination} on ${date}. Try a different date or route.`;
  }

  let msg = `*${origin}→${destination} · ${date}*\n`;
  msg += `Found ${results.length} option${results.length > 1 ? "s" : ""}:\n`;

  results.forEach((r, i) => {
    const offer = r.offer;
    const seg = offer.segments[0];
    const price = formatPrice(offer.price.total, offer.price.currency);
    const dep = formatTime(seg.departure.time);
    const arr = formatTime(seg.arrival.time);

    let line = `\n*${i + 1}.* ${seg.airlineCode} ${seg.flightNumber}`;
    line += ` · ${dep}–${arr}`;
    line += ` · ${offer.totalDuration}`;
    if (offer.stops > 0) line += ` · ${offer.stops} stop${offer.stops > 1 ? "s" : ""}`;
    line += `\n    ${price}`;

    // Baggage info
    if (offer.baggageIncluded?.checked) {
      line += ` · ${offer.baggageIncluded.checkedWeightKg ?? offer.baggageIncluded.checked}kg bag`;
    }

    // Seats remaining
    if (offer.seatsRemaining && offer.seatsRemaining <= 5) {
      line += ` · ⚡ ${offer.seatsRemaining} left`;
    }

    // Policy compliance
    if (r.compliance.status === "warning") {
      line += `\n    ⚠️ ${r.compliance.violations[0]}`;
    } else if (r.compliance.status === "blocked") {
      line += `\n    🚫 ${r.compliance.violations[0]}`;
    }

    msg += line;
  });

  msg += "\n\nReply with a number (1-" + results.length + ") to select, or type *cancel*.";

  return msg;
}

/**
 * Format flight results as WhatsApp interactive list sections.
 * Returns sections array for sendInteractiveList().
 */
export function formatFlightResultsAsList(
  results: CorporateFlightResult[]
): Array<{
  title: string;
  rows: Array<{ id: string; title: string; description: string }>;
}> {
  const rows = results.map((r, i) => {
    const seg = r.offer.segments[0];
    const price = formatPrice(r.offer.price.total, r.offer.price.currency);
    const dep = formatTime(seg.departure.time);
    const complianceIcon =
      r.compliance.status === "compliant" ? "✅" :
      r.compliance.status === "warning" ? "⚠️" : "🚫";

    return {
      id: `select_flight_${i}`,
      title: `${complianceIcon} ${seg.airlineCode} ${seg.flightNumber} · ${dep} · ${price}`,
      description: `${r.offer.totalDuration}${r.offer.stops ? ` · ${r.offer.stops} stop` : " · Nonstop"}${r.compliance.violations.length ? ` · ${r.compliance.violations[0]}` : ""}`,
    };
  });

  return [{ title: "Available Flights", rows }];
}

/**
 * Format a booking confirmation for WhatsApp.
 */
export function formatBookingConfirmation(booking: BookingSummary): string {
  const statusEmoji =
    booking.status === "booked" ? "✅" :
    booking.status === "pending_approval" ? "⏳" :
    booking.status === "approved" ? "👍" : "📋";

  let msg = `${statusEmoji} *Booking ${booking.status === "booked" ? "Confirmed" : booking.status.replace("_", " ")}!*\n\n`;

  msg += `✈️ *${booking.origin}→${booking.destination}*\n`;
  msg += `📅 ${booking.departureDate}\n`;
  msg += `🕐 ${booking.departureTime} – ${booking.arrivalTime}\n`;
  msg += `🛫 ${booking.airline} ${booking.flightNumber}\n`;
  msg += `💺 ${booking.cabin}\n`;
  msg += `👤 ${booking.passengerName}\n`;
  msg += `💰 ${formatPrice(booking.totalAmount, booking.currency)}\n`;

  if (booking.pnr) {
    msg += `\n📋 *PNR: ${booking.pnr}*`;
  }

  if (booking.approvalStatus === "pending") {
    msg += "\n\n⏳ _Sent for manager approval. I'll notify you when it's confirmed._";
  }

  return msg;
}

/**
 * Format an approval request for the approver (manager).
 */
export function formatApprovalRequest(request: ApprovalRequestSummary): string {
  let msg = "📋 *New booking approval request*\n\n";
  msg += `👤 From: ${request.requesterName}\n`;
  msg += `✈️ ${request.origin}→${request.destination}\n`;
  msg += `📅 ${request.departureDate}\n`;
  if (request.airline) msg += `🛫 ${request.airline}\n`;
  msg += `💰 ${formatPrice(request.totalAmount, request.currency)}\n`;

  if (request.policyViolations.length > 0) {
    msg += `\n⚠️ *Policy violations:*\n`;
    for (const v of request.policyViolations) {
      msg += `  • ${v}\n`;
    }
  }

  msg += "\nReply *approve* or *reject* to respond.";

  return msg;
}

/**
 * Format policy violation explanation.
 */
export function formatPolicyViolation(violations: string[], policyMode: "soft" | "hard"): string {
  let msg = "⚠️ *Policy check:*\n";
  for (const v of violations) {
    msg += `  • ${v}\n`;
  }

  if (policyMode === "hard") {
    msg += "\n🚫 This booking is *blocked* by company policy. Contact your travel manager for an override.";
  } else {
    msg += "\n_This is outside policy but can proceed. Your manager will be notified._";
  }

  return msg;
}

/**
 * Format a single flight offer as a detailed view (for confirming state).
 */
export function formatFlightDetail(offer: FlightOffer): string {
  let msg = "";
  for (const seg of offer.segments) {
    msg += formatSegmentLine(seg);
    msg += `\n  ${seg.departure.airportCode}→${seg.arrival.airportCode}`;
    if (seg.departure.terminal) msg += ` · T${seg.departure.terminal}`;
    msg += "\n";
  }

  msg += `\n💰 *${formatPrice(offer.price.total, offer.price.currency)}*`;

  if (offer.price.markup) {
    msg += ` (includes ₹${Math.round(offer.price.markup)} service charge)`;
  }

  if (offer.conditions) {
    const conds: string[] = [];
    if (offer.conditions.refundable) conds.push("Refundable");
    else conds.push("Non-refundable");
    if (offer.conditions.changeable) conds.push("Changeable");
    msg += `\n📜 ${conds.join(" · ")}`;
  }

  if (offer.baggageIncluded) {
    const parts: string[] = [];
    if (offer.baggageIncluded.carryOn) parts.push(`${offer.baggageIncluded.carryOn} carry-on`);
    if (offer.baggageIncluded.checked) {
      parts.push(`${offer.baggageIncluded.checked} checked${offer.baggageIncluded.checkedWeightKg ? ` (${offer.baggageIncluded.checkedWeightKg}kg)` : ""}`);
    }
    if (parts.length) msg += `\n🧳 ${parts.join(" + ")}`;
  }

  return msg;
}
