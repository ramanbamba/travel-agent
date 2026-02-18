// ============================================================================
// Phase 4 — Corporate Multi-Tenant Types
// ============================================================================

// ── Organizations ──

export type OrgIndustry =
  | "it_services"
  | "bfsi"
  | "consulting"
  | "pharma"
  | "startup"
  | "other";

export type OrgEmployeeCountRange =
  | "1-50"
  | "51-200"
  | "201-500"
  | "501-2000"
  | "2000+";

export type OrgTravelSpendRange =
  | "under_10l"
  | "10l_50l"
  | "50l_1cr"
  | "1cr_5cr"
  | "5cr_10cr"
  | "above_10cr";

export type OrgPlan = "free" | "growth" | "enterprise";

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pin: string;
  country: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  industry: OrgIndustry | null;
  employee_count_range: OrgEmployeeCountRange | null;
  annual_travel_spend_range: OrgTravelSpendRange | null;
  gstin: string | null;
  gst_state_code: string | null;
  billing_address: BillingAddress | null;
  default_currency: string;
  timezone: string;
  plan: OrgPlan;
  plan_started_at: string | null;
  monthly_booking_limit: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ── Org Members ──

export type OrgMemberRole = "admin" | "travel_manager" | "approver" | "employee";

export type SeniorityLevel =
  | "individual_contributor"
  | "manager"
  | "director"
  | "vp"
  | "c_suite";

export type MemberStatus = "invited" | "active" | "deactivated";

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  whatsapp_registered: boolean;
  employee_id: string | null;
  department: string | null;
  designation: string | null;
  seniority_level: SeniorityLevel;
  role: OrgMemberRole;
  reports_to: string | null;
  status: MemberStatus;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Travel Policies ──

export interface CabinClassOverride {
  seniority: SeniorityLevel[];
  allowed: string[];
}

export interface FlightRules {
  domestic_cabin_class: {
    default: string;
    overrides: CabinClassOverride[];
  };
  max_flight_price: {
    domestic: number | null;
    international: number | null;
  };
  advance_booking_days: {
    minimum: number;
    recommended: number;
    early_booking_discount_message: boolean;
  };
  preferred_airlines: string[];
  blocked_airlines: string[];
  allow_refundable_only: boolean;
  max_stops: number;
  flight_duration_limit_hours: number | null;
}

export interface SpendLimits {
  per_trip_limit: number | null;
  per_month_limit: number | null;
  by_seniority: Record<SeniorityLevel, number | undefined>;
}

export interface ApprovalRules {
  auto_approve_under: number | null;
  require_approval_over: number;
  out_of_policy_requires: "travel_manager" | "admin";
  approval_timeout_hours: number;
  auto_escalate_on_timeout: boolean;
}

export type PolicyMode = "soft" | "hard";

export interface TravelPolicy {
  id: string;
  org_id: string;
  name: string;
  is_active: boolean;
  flight_rules: FlightRules;
  hotel_rules: Record<string, unknown>;
  spend_limits: SpendLimits;
  approval_rules: ApprovalRules;
  policy_mode: PolicyMode;
  created_at: string;
  updated_at: string;
}

// ── Corp Bookings ──

export type TripType = "one_way" | "round_trip" | "multi_city";

export type BookingPurpose =
  | "client_meeting"
  | "conference"
  | "internal"
  | "training"
  | "other";

export type BookingChannel = "whatsapp" | "web" | "admin_booked";

export type CorpBookingStatus =
  | "pending"
  | "pending_approval"
  | "approved"
  | "booked"
  | "cancelled"
  | "completed";

export type ApprovalStatus =
  | "auto_approved"
  | "pending"
  | "approved"
  | "rejected";

export interface PolicyViolation {
  rule: string;
  message: string;
}

export interface CorpBooking {
  id: string;
  org_id: string;
  member_id: string;
  booked_by: string | null;
  trip_type: TripType;
  purpose: BookingPurpose | null;
  purpose_note: string | null;
  project_code: string | null;
  cost_center: string | null;
  booking_channel: BookingChannel;
  duffel_order_id: string | null;
  pnr: string | null;
  status: CorpBookingStatus;
  flight_details: Record<string, unknown>;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string | null;
  cabin_class: string | null;
  airline_code: string | null;
  airline_name: string | null;
  policy_compliant: boolean;
  policy_violations: PolicyViolation[];
  policy_override_reason: string | null;
  policy_override_by: string | null;
  total_amount: number;
  currency: string;
  payment_method: string | null;
  payment_id: string | null;
  gst_invoice_number: string | null;
  gst_invoice_url: string | null;
  gst_amount: number | null;
  gst_itc_eligible: boolean;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

// ── Approval Requests ──

export type ApprovalRequestStatus = "pending" | "approved" | "rejected" | "expired";

export interface ApprovalRequest {
  id: string;
  org_id: string;
  booking_id: string;
  requester_id: string;
  approver_id: string;
  status: ApprovalRequestStatus;
  message: string | null;
  response_message: string | null;
  responded_at: string | null;
  expires_at: string | null;
  notified_via: "whatsapp" | "email" | "both";
  created_at: string;
}

// ── GST Invoices ──

export type GstInvoiceSource = "auto" | "manual" | "ocr";

export interface GstInvoice {
  id: string;
  org_id: string;
  booking_id: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  vendor_name: string;
  vendor_gstin: string | null;
  base_amount: number | null;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_gst: number | null;
  total_amount: number | null;
  itc_eligible: boolean;
  itc_claimed: boolean;
  itc_claim_period: string | null;
  sac_code: string;
  source: GstInvoiceSource;
  raw_invoice_url: string | null;
  reconciled: boolean;
  reconciled_with: string | null;
  exported_to: string | null;
  exported_at: string | null;
  created_at: string;
}

// ── Traveler Preferences ──

export interface FrequentRoute {
  origin: string;
  destination: string;
  count: number;
}

export interface TravelerPreference {
  id: string;
  org_id: string;
  member_id: string;
  preferred_airlines: string[];
  preferred_departure_window: "early_morning" | "morning" | "afternoon" | "evening";
  seat_preference: "aisle" | "window" | "no_preference";
  meal_preference: string | null;
  bag_preference: string;
  price_sensitivity: number;
  frequent_routes: FrequentRoute[];
  booking_lead_time_avg: number | null;
  total_bookings: number;
  preference_confidence: number;
  created_at: string;
  updated_at: string;
}

// ── WhatsApp Sessions ──

export type WhatsAppSessionState =
  | "idle"
  | "searching"
  | "selecting"
  | "confirming"
  | "awaiting_approval";

export interface WhatsAppSession {
  id: string;
  phone_number: string;
  org_id: string | null;
  member_id: string | null;
  state: WhatsAppSessionState;
  context: Record<string, unknown>;
  last_message_at: string;
  verified: boolean;
  created_at: string;
}

// ── Booking Analytics ──

export type AnalyticsPeriodType = "month" | "quarter" | "year";

export interface RouteAnalytic {
  origin: string;
  destination: string;
  count: number;
  total_spend: number;
}

export interface AirlineAnalytic {
  code: string;
  name: string;
  count: number;
}

export interface BookingAnalytics {
  id: string;
  org_id: string;
  period: string;
  period_type: AnalyticsPeriodType;
  total_bookings: number;
  total_spend: number;
  avg_booking_value: number;
  policy_compliance_rate: number;
  avg_advance_booking_days: number;
  gst_itc_recovered: number;
  estimated_savings: number;
  savings_vs_last_period: number;
  top_routes: RouteAnalytic[];
  top_airlines: AirlineAnalytic[];
  spend_by_department: Record<string, number>;
  bookings_by_channel: Record<BookingChannel, number>;
  created_at: string;
}

// ── WhatsApp Message Log ──

export type MessageDirection = "inbound" | "outbound";
export type WhatsAppMessageType = "text" | "interactive" | "template" | "document";

export interface WhatsAppMessageLog {
  id: string;
  phone_number: string;
  direction: MessageDirection;
  message_type: WhatsAppMessageType;
  content: Record<string, unknown>;
  created_at: string;
}
