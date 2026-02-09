export default function SettingsLoading() {
  return (
    <div className="p-6">
      <div className="h-7 w-24 animate-pulse rounded bg-white/5" />
      <div className="mt-1 h-4 w-72 animate-pulse rounded bg-white/5" />
      <div className="mt-6 max-w-2xl space-y-6">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
          <div className="h-5 w-28 animate-pulse rounded bg-white/5" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-white/5"
              />
            ))}
          </div>
        </div>
        <div className="h-16 animate-pulse rounded-lg border border-white/10 bg-white/[0.02]" />
      </div>
    </div>
  );
}
