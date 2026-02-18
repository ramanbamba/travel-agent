export default function CorpLoading() {
  return (
    <div className="animate-pulse p-6">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-7 w-40 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-64 rounded bg-gray-100" />
      </div>
      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="h-4 w-20 rounded bg-gray-100" />
            <div className="mt-2 h-8 w-24 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-16 rounded bg-gray-100" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-1/4 rounded bg-gray-100" />
              <div className="h-4 w-1/4 rounded bg-gray-100" />
              <div className="h-4 w-1/6 rounded bg-gray-100" />
              <div className="h-4 w-1/6 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
