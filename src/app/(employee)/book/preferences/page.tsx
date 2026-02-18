"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Save, Plane, Clock, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrefsData = any;

const AIRLINES = [
  { code: "6E", name: "IndiGo" },
  { code: "AI", name: "Air India" },
  { code: "UK", name: "Vistara" },
  { code: "SG", name: "SpiceJet" },
  { code: "QP", name: "Akasa Air" },
  { code: "I5", name: "AirAsia India" },
];

const TIME_WINDOWS = [
  { value: "early_morning", label: "Early Morning (5-8 AM)" },
  { value: "morning", label: "Morning (8-12 PM)" },
  { value: "afternoon", label: "Afternoon (12-4 PM)" },
  { value: "evening", label: "Evening (4-8 PM)" },
  { value: "night", label: "Night (8 PM+)" },
];

const SEAT_PREFS = ["aisle", "window", "middle", "no_preference"];
const MEAL_PREFS = ["vegetarian", "non_vegetarian", "vegan", "jain", "no_preference"];

export default function PreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    preferred_airlines: [] as string[],
    departure_window: "morning",
    seat_preference: "no_preference",
    meal_preference: "no_preference",
    bag_preference: "cabin_only",
  });
  const [learned, setLearned] = useState<PrefsData | null>(null);

  const loadPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/corp/employee/preferences");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      if (json.data?.preferences) {
        setPrefs({
          ...prefs,
          ...json.data.preferences,
        });
      }
      if (json.data?.learned) {
        setLearned(json.data.learned);
      }
    } catch (err) {
      console.error("Load prefs error:", err);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/corp/employee/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Preferences saved" });
    } catch {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl overflow-y-auto p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F1B2D]">Preferences</h1>
          <p className="text-sm text-gray-500">
            Your preferences help us find better flights faster
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
      </div>

      {/* Learned Insights (read-only) */}
      {learned && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-800">
            <TrendingUp className="h-4 w-4" />
            Learned from Your Bookings
          </h2>
          <div className="space-y-2 text-sm text-blue-700">
            {learned.topRoute && (
              <p className="flex items-center gap-2">
                <Plane className="h-3.5 w-3.5" />
                Most-booked route: <strong>{learned.topRoute.route}</strong> ({learned.topRoute.count} times)
              </p>
            )}
            {learned.avgAdvanceDays != null && (
              <p className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                You usually book <strong>{learned.avgAdvanceDays} days</strong> ahead
              </p>
            )}
            {learned.topAirline && (
              <p className="flex items-center gap-2">
                <Plane className="h-3.5 w-3.5" />
                You prefer <strong>{learned.topAirline.name}</strong> (chosen {learned.topAirline.count}/{learned.totalBookings} times)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Editable Preferences */}
      <div className="space-y-6">
        {/* Preferred Airlines */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#0F1B2D]">
            Preferred Airlines
          </h3>
          <div className="flex flex-wrap gap-2">
            {AIRLINES.map((a) => (
              <button
                key={a.code}
                onClick={() => {
                  const current = prefs.preferred_airlines;
                  setPrefs({
                    ...prefs,
                    preferred_airlines: current.includes(a.code)
                      ? current.filter((c) => c !== a.code)
                      : [...current, a.code],
                  });
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  prefs.preferred_airlines.includes(a.code)
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Departure Window */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#0F1B2D]">
            Preferred Departure Time
          </h3>
          <div className="space-y-2">
            {TIME_WINDOWS.map((tw) => (
              <label
                key={tw.value}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="departure_window"
                  value={tw.value}
                  checked={prefs.departure_window === tw.value}
                  onChange={(e) =>
                    setPrefs({ ...prefs, departure_window: e.target.value })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{tw.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Seat & Meal */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-[#0F1B2D]">
              Seat Preference
            </h3>
            <select
              value={prefs.seat_preference}
              onChange={(e) =>
                setPrefs({ ...prefs, seat_preference: e.target.value })
              }
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm capitalize focus:border-blue-300 focus:outline-none"
            >
              {SEAT_PREFS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-[#0F1B2D]">
              Meal Preference
            </h3>
            <select
              value={prefs.meal_preference}
              onChange={(e) =>
                setPrefs({ ...prefs, meal_preference: e.target.value })
              }
              className="h-9 w-full rounded-lg border border-gray-200 px-3 text-sm capitalize focus:border-blue-300 focus:outline-none"
            >
              {MEAL_PREFS.map((m) => (
                <option key={m} value={m}>
                  {m.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bag Preference */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#0F1B2D]">
            Bag Preference
          </h3>
          <div className="flex gap-3">
            {[
              { value: "cabin_only", label: "Cabin Only" },
              { value: "checked_15kg", label: "15kg Checked" },
              { value: "checked_23kg", label: "23kg Checked" },
            ].map((b) => (
              <button
                key={b.value}
                onClick={() => setPrefs({ ...prefs, bag_preference: b.value })}
                className={`flex-1 rounded-lg border p-3 text-center text-xs font-medium transition-colors ${
                  prefs.bag_preference === b.value
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
