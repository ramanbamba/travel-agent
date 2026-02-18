// ============================================================================
// GST Invoice PDF Generator
// Generates a GST-compliant invoice for corporate air travel bookings
// ============================================================================

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface GstInvoicePdfData {
  invoiceNumber: string;
  invoiceDate: string;
  // Buyer (company)
  buyerName: string;
  buyerGstin: string;
  buyerAddress: string;
  // Vendor (airline / SkySwift)
  vendorName: string;
  vendorGstin: string | null;
  // Booking details
  pnr: string;
  route: string;
  departureDate: string;
  passengerName: string;
  // Amounts
  baseAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  totalAmount: number;
  currency: string;
  sacCode: string;
  itcEligible: boolean;
}

function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export async function generateGstInvoicePdf(
  data: GstInvoicePdfData
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const darkGray = rgb(0.2, 0.2, 0.2);
  const gray = rgb(0.5, 0.5, 0.5);
  const blue = rgb(0.0, 0.4, 0.8);
  const lineColor = rgb(0.85, 0.85, 0.85);

  let y = height - 50;
  const margin = 50;

  // ── Header ──
  page.drawText("TAX INVOICE", {
    x: margin, y, font: fontBold, size: 18, color: darkGray,
  });
  page.drawText("(Under GST)", {
    x: margin, y: y - 18, font: fontRegular, size: 10, color: gray,
  });

  // Invoice number + date (right side)
  page.drawText(`Invoice #: ${data.invoiceNumber}`, {
    x: width - margin - fontBold.widthOfTextAtSize(`Invoice #: ${data.invoiceNumber}`, 11),
    y, font: fontBold, size: 11, color: darkGray,
  });
  page.drawText(`Date: ${data.invoiceDate}`, {
    x: width - margin - fontRegular.widthOfTextAtSize(`Date: ${data.invoiceDate}`, 10),
    y: y - 16, font: fontRegular, size: 10, color: gray,
  });

  y -= 50;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: lineColor });
  y -= 25;

  // ── Vendor Details (left) & Buyer Details (right) ──
  const colWidth = (width - margin * 2) / 2;

  page.drawText("From (Vendor):", { x: margin, y, font: fontBold, size: 10, color: gray });
  page.drawText(data.vendorName, { x: margin, y: y - 16, font: fontBold, size: 11, color: darkGray });
  if (data.vendorGstin) {
    page.drawText(`GSTIN: ${data.vendorGstin}`, { x: margin, y: y - 32, font: fontRegular, size: 9, color: gray });
  }

  const rightX = margin + colWidth + 20;
  page.drawText("To (Buyer):", { x: rightX, y, font: fontBold, size: 10, color: gray });
  page.drawText(data.buyerName, { x: rightX, y: y - 16, font: fontBold, size: 11, color: darkGray });
  page.drawText(`GSTIN: ${data.buyerGstin}`, { x: rightX, y: y - 32, font: fontRegular, size: 9, color: darkGray });
  page.drawText(data.buyerAddress, { x: rightX, y: y - 48, font: fontRegular, size: 9, color: gray });

  y -= 70;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: lineColor });
  y -= 25;

  // ── Service Details ──
  page.drawText("Service Details", { x: margin, y, font: fontBold, size: 11, color: darkGray });
  y -= 20;

  const details = [
    ["PNR", data.pnr],
    ["Route", data.route],
    ["Date", data.departureDate],
    ["Passenger", data.passengerName],
    ["SAC Code", data.sacCode],
    ["Description", "Air passenger transport services"],
  ];

  for (const [label, value] of details) {
    page.drawText(`${label}:`, { x: margin + 10, y, font: fontRegular, size: 10, color: gray });
    page.drawText(value, { x: margin + 120, y, font: fontRegular, size: 10, color: darkGray });
    y -= 16;
  }

  y -= 15;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: lineColor });
  y -= 25;

  // ── Amount Breakdown ──
  page.drawText("Amount Breakdown", { x: margin, y, font: fontBold, size: 11, color: darkGray });
  y -= 25;

  const amounts = [
    ["Base Fare (Taxable Value)", formatINR(data.baseAmount)],
    ...(data.cgst > 0 ? [["CGST @ 2.5%", formatINR(data.cgst)]] : []),
    ...(data.sgst > 0 ? [["SGST @ 2.5%", formatINR(data.sgst)]] : []),
    ...(data.igst > 0 ? [["IGST @ 5%", formatINR(data.igst)]] : []),
    ["Total GST", formatINR(data.totalGst)],
  ];

  for (const [label, value] of amounts) {
    page.drawText(label, { x: margin + 10, y, font: fontRegular, size: 10, color: darkGray });
    page.drawText(value, {
      x: width - margin - fontRegular.widthOfTextAtSize(value, 10) - 10,
      y, font: fontRegular, size: 10, color: darkGray,
    });
    y -= 18;
  }

  // Total line
  y -= 5;
  page.drawLine({ start: { x: margin + 250, y }, end: { x: width - margin, y }, thickness: 1, color: darkGray });
  y -= 20;

  const totalStr = formatINR(data.totalAmount);
  page.drawText("Total Amount", { x: margin + 10, y, font: fontBold, size: 12, color: darkGray });
  page.drawText(totalStr, {
    x: width - margin - fontBold.widthOfTextAtSize(totalStr, 14) - 10,
    y, font: fontBold, size: 14, color: blue,
  });

  y -= 35;

  // ITC eligibility
  page.drawText(
    data.itcEligible
      ? "✓ Eligible for Input Tax Credit (ITC)"
      : "✗ Not eligible for Input Tax Credit",
    { x: margin + 10, y, font: fontRegular, size: 10, color: data.itcEligible ? rgb(0, 0.6, 0.3) : gray }
  );

  y -= 40;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: lineColor });
  y -= 25;

  // ── Footer ──
  page.drawText("This is a computer-generated invoice and does not require a signature.", {
    x: margin, y, font: fontRegular, size: 8, color: gray,
  });
  page.drawText("Generated by SkySwift — Corporate Travel Management", {
    x: margin, y: y - 14, font: fontRegular, size: 8, color: gray,
  });

  return doc.save();
}
