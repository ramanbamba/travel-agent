import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { exportTallyCsv, exportZohoCsv } from "@/lib/gst/export";
import type { GstInvoiceRow } from "@/lib/gst/export";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = any;
const db = supabase as DbRow;

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const orgId = p.get("org_id");
    const format = p.get("format"); // "tally" | "zoho" | null (JSON)

    if (!orgId) {
      return NextResponse.json({ data: null, error: "org_id required" }, { status: 400 });
    }

    let query = db
      .from("gst_invoices")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    const quarter = p.get("quarter"); // e.g. "2026-Q1"
    if (quarter) {
      const [year, q] = quarter.split("-Q");
      const qNum = Number(q);
      const startMonth = (qNum - 1) * 3;
      const start = new Date(Number(year), startMonth, 1).toISOString();
      const end = new Date(Number(year), startMonth + 3, 0, 23, 59, 59).toISOString();
      query = query.gte("created_at", start).lte("created_at", end);
    }

    const { data: invoices, error } = await query;
    if (error) throw error;

    // If CSV export requested
    if (format === "tally" || format === "zoho") {
      // Enrich with booking PNR/route
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
          itcClaimed: 0, // Placeholder — would come from reconciliation
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
