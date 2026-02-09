-- 00006: Supplier booking columns
-- Add new data_source enum values for Duffel and Mock suppliers,
-- and columns to track supplier-side booking details.

-- Add new enum values to data_source
alter type data_source add value if not exists 'duffel';
alter type data_source add value if not exists 'mock';

-- Add supplier tracking columns to bookings
alter table public.bookings
  add column if not exists supplier_name       text,
  add column if not exists supplier_booking_id  text,
  add column if not exists supplier_offer_id    text;

-- Index for cancellation/lookup by supplier booking ID
create index if not exists idx_bookings_supplier_booking_id
  on public.bookings (supplier_booking_id)
  where supplier_booking_id is not null;
