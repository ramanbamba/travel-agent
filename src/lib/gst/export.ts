/**
 * GST invoice CSV export for Tally and Zoho formats.
 */

export interface GstInvoiceRow {
  id: string;
  booking_id: string;
  vendor_name: string;
  vendor_gstin: string | null;
  base_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_gst: number;
  total_amount: number;
  itc_eligible: boolean;
  sac_code: string;
  created_at: string;
  // Joined from booking
  pnr?: string;
  origin?: string;
  destination?: string;
}

function escCsv(val: string | number | null | undefined): string {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Tally Purchase Voucher import format
 */
export function exportTallyCsv(invoices: GstInvoiceRow[]): string {
  const headers = [
    "Date",
    "Voucher Type",
    "Party Name",
    "GSTIN",
    "Invoice No",
    "Amount",
    "CGST",
    "SGST",
    "IGST",
    "Total GST",
    "Total Amount",
    "SAC Code",
    "ITC Eligible",
  ];

  const rows = invoices.map((inv) => [
    escCsv(formatDate(inv.created_at)),
    escCsv("Purchase"),
    escCsv(inv.vendor_name),
    escCsv(inv.vendor_gstin),
    escCsv(inv.pnr ?? inv.booking_id),
    escCsv(inv.base_amount),
    escCsv(inv.cgst_amount),
    escCsv(inv.sgst_amount),
    escCsv(inv.igst_amount),
    escCsv(inv.total_gst),
    escCsv(inv.total_amount),
    escCsv(inv.sac_code),
    escCsv(inv.itc_eligible ? "Yes" : "No"),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Zoho Books import format
 */
export function exportZohoCsv(invoices: GstInvoiceRow[]): string {
  const headers = [
    "Bill Date",
    "Vendor Name",
    "Vendor GSTIN",
    "Bill Number",
    "Place of Supply",
    "Item Description",
    "SAC",
    "Taxable Amount",
    "CGST Rate",
    "CGST Amount",
    "SGST Rate",
    "SGST Amount",
    "IGST Rate",
    "IGST Amount",
    "Total",
    "ITC Eligibility",
  ];

  const rows = invoices.map((inv) => {
    const gstRate = inv.base_amount > 0 ? Math.round((inv.total_gst / inv.base_amount) * 100) : 5;
    const halfRate = Math.round(gstRate / 2);
    const description = inv.origin && inv.destination
      ? `Air Travel ${inv.origin}-${inv.destination}`
      : "Air Travel Services";

    return [
      escCsv(formatDate(inv.created_at)),
      escCsv(inv.vendor_name),
      escCsv(inv.vendor_gstin),
      escCsv(inv.pnr ?? inv.booking_id),
      escCsv(""),
      escCsv(description),
      escCsv(inv.sac_code),
      escCsv(inv.base_amount),
      escCsv(inv.igst_amount > 0 ? 0 : halfRate),
      escCsv(inv.cgst_amount),
      escCsv(inv.igst_amount > 0 ? 0 : halfRate),
      escCsv(inv.sgst_amount),
      escCsv(inv.igst_amount > 0 ? gstRate : 0),
      escCsv(inv.igst_amount),
      escCsv(inv.total_amount),
      escCsv(inv.itc_eligible ? "Eligible" : "Ineligible"),
    ];
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Generic bookings CSV export for finance teams
 */
export function exportBookingsCsv(
  bookings: Array<{
    pnr: string | null;
    member_name: string;
    origin: string;
    destination: string;
    departure_date: string;
    airline_name: string | null;
    total_amount: number;
    currency: string;
    status: string;
    booking_channel: string;
    policy_compliant: boolean;
    created_at: string;
  }>
): string {
  const headers = [
    "Date",
    "PNR",
    "Traveler",
    "Route",
    "Departure",
    "Airline",
    "Amount",
    "Currency",
    "Status",
    "Channel",
    "Policy Compliant",
  ];

  const rows = bookings.map((b) => [
    escCsv(formatDate(b.created_at)),
    escCsv(b.pnr),
    escCsv(b.member_name),
    escCsv(`${b.origin}-${b.destination}`),
    escCsv(b.departure_date),
    escCsv(b.airline_name),
    escCsv(b.total_amount),
    escCsv(b.currency),
    escCsv(b.status),
    escCsv(b.booking_channel),
    escCsv(b.policy_compliant ? "Yes" : "No"),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
