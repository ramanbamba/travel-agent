import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-muted-foreground">
          Where are you headed next?
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-white/5 bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Flights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <p className="mt-1 text-xs text-muted-foreground">No upcoming bookings</p>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
            <p className="mt-1 text-xs text-muted-foreground">Flights booked</p>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Time Saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0 min</p>
            <p className="mt-1 text-xs text-muted-foreground">vs traditional booking</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 border-white/5 bg-white/[0.02]">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold">Start a conversation</h3>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            Tell us where you want to go and we&apos;ll handle the rest. The chat interface is coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
