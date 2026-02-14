-- ============================================================================
-- Migration 00011: Flight DNA Seed Data (P3-06)
-- Curated product data for top flights on ICP routes:
--   BLR→DEL, BLR→BOM, BLR→HYD
-- Sources: DGCA on-time reports, airline websites, seat map data
-- ============================================================================

-- Clear any existing seed data to make this idempotent
DELETE FROM public.flight_dna
WHERE route IN ('BLR-DEL', 'BLR-BOM', 'BLR-HYD', 'DEL-BLR', 'BOM-BLR', 'HYD-BLR');

-- ============================================================================
-- BLR → DEL (Bangalore to Delhi) — ~60 daily flights, 2h 30m–2h 50m
-- ============================================================================

-- IndiGo (6E) — 39 daily flights, 64% market share, best on-time
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('6E', 'BLR-DEL', '6E-302',  'A320neo', 30, false, 87.4, 3.0, false, 'streaming', 'cabin_only', 'Popular early morning. VISTA streaming entertainment via personal device. USB charging in business rows only.'),
('6E', 'BLR-DEL', '6E-508',  'A320neo', 30, false, 87.4, 3.0, false, 'streaming', 'cabin_only', 'Pre-dawn departure 04:25. Same A320neo config.'),
('6E', 'BLR-DEL', '6E-6813', 'A320neo', 30, false, 87.4, 3.0, false, 'streaming', 'cabin_only', 'Late night 23:30 departure. Red-eye option.'),
('6E', 'BLR-DEL', NULL,       'A320neo', 30, false, 87.4, 3.0, false, 'streaming', 'cabin_only', 'Generic IndiGo BLR-DEL. 186-seat config, 30" pitch economy.');

-- Air India (AI) — 18 daily flights, full-service carrier
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('AI', 'BLR-DEL', 'AI-501',  'A320neo', 32, false, 79.7, 3.8, true, 'personal_screen', '15kg', 'Full-service. Complimentary meal + 15kg checked bag. IFE on select aircraft. USB charging all seats.'),
('AI', 'BLR-DEL', 'AI-505',  'A321neo', 32, false, 79.7, 3.8, true, 'personal_screen', '15kg', 'Larger A321neo. Same amenities. Higher capacity.'),
('AI', 'BLR-DEL', NULL,       'A320neo', 32, false, 79.7, 3.8, true, 'personal_screen', '15kg', 'Generic Air India BLR-DEL. Full-service domestic with meal and baggage included.');

-- Akasa Air (QP) — 4 daily flights, newest fleet
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('QP', 'BLR-DEL', NULL, 'B737 MAX 8', 31, true, 86.9, 3.2, true, 'streaming', 'cabin_only', 'Newest fleet in India. Wi-Fi available. USB + power outlets at every seat. Cafe Akasa buy-on-board.');

-- SpiceJet (SG) — 3 daily flights, older fleet
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('SG', 'BLR-DEL', 'SG-530', 'B737-800', 30, false, 46.9, 2.5, false, 'none', 'cabin_only', 'Late departure 23:45. Older B737-800. Low on-time performance. Buy-on-board meals.');

-- Air India Express (IX) — budget subsidiary
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('IX', 'BLR-DEL', NULL, 'A320', 29, false, 80.0, 2.8, false, 'none', 'cabin_only', 'Budget carrier. Tighter pitch. No frills. Competitive pricing.');

-- ============================================================================
-- BLR → BOM (Bangalore to Mumbai) — ~50 daily flights, 1h 50m–2h 00m
-- ============================================================================

-- IndiGo (6E) — highest frequency
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('6E', 'BLR-BOM', '6E-511',  'A320neo', 30, false, 87.4, 3.0, false, 'streaming', 'cabin_only', 'Popular morning slot. VISTA streaming. Short 1h 55m flight.'),
('6E', 'BLR-BOM', '6E-5315', 'A320neo', 30, false, 87.4, 3.0, false, 'streaming', 'cabin_only', 'Afternoon departure option.'),
('6E', 'BLR-BOM', NULL,       'A320neo', 30, false, 87.4, 3.0, false, 'streaming', 'cabin_only', 'Generic IndiGo BLR-BOM. 20+ daily flights available.');

-- Air India (AI)
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('AI', 'BLR-BOM', 'AI-589',  'A320neo', 32, false, 79.7, 3.8, true, 'personal_screen', '15kg', 'Full-service. Meal included. USB charging. 15kg checked bag.'),
('AI', 'BLR-BOM', NULL,       'A320neo', 32, false, 79.7, 3.8, true, 'personal_screen', '15kg', 'Generic Air India BLR-BOM. Multiple daily frequencies.');

-- Akasa Air (QP)
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('QP', 'BLR-BOM', NULL, 'B737 MAX 8', 31, true, 86.9, 3.2, true, 'streaming', 'cabin_only', 'Newest fleet. Wi-Fi enabled. Power outlets at every seat.');

-- SpiceJet (SG)
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('SG', 'BLR-BOM', NULL, 'B737-800', 30, false, 46.9, 2.5, false, 'none', 'cabin_only', 'Budget option. Low reliability scores. Older aircraft.');

-- ============================================================================
-- BLR → HYD (Bangalore to Hyderabad) — ~45 daily flights, 1h 15m–1h 25m
-- ============================================================================

-- IndiGo (6E) — 30+ daily flights
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('6E', 'BLR-HYD', '6E-701',  'A320neo', 30, false, 87.4, 3.0, false, 'streaming', 'cabin_only', 'Short hop — 1h 15m. VISTA streaming. Very high frequency.'),
('6E', 'BLR-HYD', '6E-703',  'A320neo', 30, false, 87.4, 3.0, false, 'streaming', 'cabin_only', 'Midday departure option.'),
('6E', 'BLR-HYD', NULL,       'A320neo', 30, false, 87.4, 3.0, false, 'streaming', 'cabin_only', 'Generic IndiGo BLR-HYD. 30+ daily flights.');

-- Air India (AI) — 15 daily flights
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('AI', 'BLR-HYD', NULL, 'A320neo', 32, false, 79.7, 3.8, true, 'personal_screen', '15kg', 'Full-service even on short hop. Meal + 15kg bag included.');

-- Akasa Air (QP) — growing presence
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('QP', 'BLR-HYD', NULL, 'B737 MAX 8', 31, true, 86.9, 3.2, true, 'streaming', 'cabin_only', 'Wi-Fi enabled. Great for quick work sessions even on short flights.');

-- Air India Express (IX) — 11 daily flights
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('IX', 'BLR-HYD', NULL, 'A320', 29, false, 80.0, 2.8, false, 'none', 'cabin_only', 'Budget option. Competitive pricing for short sector.');

-- ============================================================================
-- RETURN LEGS — mirror data for reverse routes
-- ============================================================================

-- DEL → BLR
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes)
SELECT airline_code, 'DEL-BLR', flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included,
  REPLACE(notes, 'BLR-DEL', 'DEL-BLR')
FROM public.flight_dna WHERE route = 'BLR-DEL';

-- BOM → BLR
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes)
SELECT airline_code, 'BOM-BLR', flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included,
  REPLACE(notes, 'BLR-BOM', 'BOM-BLR')
FROM public.flight_dna WHERE route = 'BLR-BOM';

-- HYD → BLR
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes)
SELECT airline_code, 'HYD-BLR', flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included,
  REPLACE(notes, 'BLR-HYD', 'HYD-BLR')
FROM public.flight_dna WHERE route = 'BLR-HYD';

-- ============================================================================
-- Additional popular inter-metro routes (generic airline-level data only)
-- ============================================================================

-- DEL → BOM
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('6E', 'DEL-BOM', NULL, 'A320neo', 30, false, 87.4, 3.0, false, 'streaming', 'cabin_only', 'India busiest air corridor. IndiGo dominates with 40+ daily flights.'),
('AI', 'DEL-BOM', NULL, 'A320neo', 32, false, 79.7, 3.8, true, 'personal_screen', '15kg', 'Full-service on busiest route. Meal + baggage included.');

-- BOM → DEL
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('6E', 'BOM-DEL', NULL, 'A320neo', 30, false, 87.4, 3.0, false, 'streaming', 'cabin_only', 'Return leg. Same fleet config.'),
('AI', 'BOM-DEL', NULL, 'A320neo', 32, false, 79.7, 3.8, true, 'personal_screen', '15kg', 'Return leg. Full-service.');

-- DEL → HYD
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('6E', 'DEL-HYD', NULL, 'A320neo', 30, false, 87.4, 3.0, false, 'streaming', 'cabin_only', 'High frequency route. ~25 daily IndiGo flights.'),
('AI', 'DEL-HYD', NULL, 'A320neo', 32, false, 79.7, 3.8, true, 'personal_screen', '15kg', 'Full-service option.');

-- HYD → DEL
INSERT INTO public.flight_dna (airline_code, route, flight_number, aircraft_type, seat_pitch, wifi, ontime_pct, food_rating, power_outlets, entertainment, baggage_included, notes) VALUES
('6E', 'HYD-DEL', NULL, 'A320neo', 30, false, 87.4, 3.0, false, 'streaming', 'cabin_only', 'Return leg.'),
('AI', 'HYD-DEL', NULL, 'A320neo', 32, false, 79.7, 3.8, true, 'personal_screen', '15kg', 'Return leg. Full-service.');
