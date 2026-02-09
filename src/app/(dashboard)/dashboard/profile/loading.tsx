export default function ProfileLoading() {
  return (
    <div className="p-6">
      <div className="h-7 w-24 animate-pulse rounded bg-white/5" />
      <div className="mt-1 h-4 w-72 animate-pulse rounded bg-white/5" />
      <div className="mt-6 max-w-2xl space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-white/10 bg-white/[0.02] p-5"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 animate-pulse rounded bg-white/5" />
              <div className="h-8 w-14 animate-pulse rounded bg-white/5" />
            </div>
            <div className="mt-4 space-y-3">
              <div className="h-3 w-full animate-pulse rounded bg-white/5" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
