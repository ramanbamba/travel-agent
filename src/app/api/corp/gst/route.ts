import { NextRequest, NextResponse } from "next/server";
import { requireCorpAuth } from "@/lib/corp/auth";
import { exportTallyCsv, exportZohoCsv } from "@/lib/gst/export";
import type { GstInvoiceRow } from "@/lib/gst/export";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;

export async function GET(req: NextRequest) {
  try {
    const auth = await requireCorpAuth({ roles: ["admin", "travel_manager", "approver"] });
    if (auth.error) return auth.error;

    const { member, db } = auth;
    const orgId = member.org_id;

    const p = req.nextUrl.searchParams;
    const format = p.get("format"); // "tally" | "zoho" | null (JSON)

    let query = db
      .from("gst_invoices")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    const quarter = p.get("quarter"); // e.g. "2026-Q1"
    if (quarter) {
      const parts = quarter.split("-Q");
      const year = Number(parts[0]);
      const qNum = Number(parts[1]);
      if (!isNaN(year) && qNum >= 1 && qNum <= 4) {
        const startMonth = (qNum - 1) * 3;
        const start = new Date(year, startMonth, 1).toISOString();
        const end = new Date(year, startMonth + 3, 0, 23, 59, 59).toISOString();
        query = query.gte("created_at", start).lte("created_at", end);
      }
    }

    const { data: invoices, error } = await query;
    if (error) throw error;

    // If CSV export requested
    if (format === "tally" || format === "zoho") {
      const bookingIds = (invoices ?? []).map((inv: DbRow) => inv.booking_id);
      const { data: bookings } = await db
        .from("corp_bookings")
        .select("id, pnr, origin, destination")
        .in("id", bookingIds.length > 0 ? bookingIds : ["__none__"]);

      const bookingMap: Record<string, DbRow> = {};
      for (const b of (bookings ?? [])) bookingMap[b.id] = b;

      const rows: GstInvoiceRow[] = (invoices ?? []).map((inv: DbRow) => ({
        ...inv,
        pnr: bookingMap[inv.booking_id]?.pnr,
        origin: bookingMap[inv.booking_id]?.origin,
        destination: bookingMap[inv.booking_id]?.destination,
      }));

      const csv = format === "tally" ? exportTallyCsv(rows) : exportZohoCsv(rows);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="gst-invoices-${format}.csv"`,
        },
      });
    }

    // JSON response with KPIs
    const all = invoices ?? [];
    const totalGst = all.reduce((s: number, i: DbRow) => s + (i.total_gst ?? 0), 0);
    const itcEligible = all
      .filter((i: DbRow) => i.itc_eligible)
      .reduce((s: number, i: DbRow) => s + (i.total_gst ?? 0), 0);

    return NextResponse.json({
      data: {
        invoices: all,
        kpi: {
          totalGst: Math.round(totalGst),
          itcEligible: Math.round(itcEligible),
          itcClaimed: 0,
          itcUnclaimed: Math.round(itcEligible),
          invoiceCount: all.length,
        },
      },
      error: null,
    });
  } catch (error) {
    console.error("[Corp GST] Error:", error);
    return NextResponse.json({ data: null, error: "Failed to load GST data" }, { status: 500 });
  }
}
