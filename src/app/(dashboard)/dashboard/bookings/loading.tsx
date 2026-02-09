export default function BookingsLoading() {
  return (
    <div className="p-6">
      <div className="h-7 w-36 animate-pulse rounded bg-white/5" />
      <div className="mt-1 h-4 w-64 animate-pulse rounded bg-white/5" />
      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 animate-pulse rounded-lg bg-white/5" />
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
                  <div className="h-3 w-48 animate-pulse rounded bg-white/5" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 animate-pulse rounded-full bg-white/5" />
                <div className="h-4 w-12 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
