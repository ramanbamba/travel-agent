export default function GstLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="h-7 w-36 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-56 rounded bg-gray-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-lg bg-gray-200" />
          <div className="h-9 w-24 rounded-lg bg-gray-200" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-gray-100" />
              <div className="h-8 w-8 rounded-lg bg-gray-100" />
            </div>
            <div className="mt-2 h-7 w-20 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Quarter filter */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-28 rounded-lg bg-gray-100" />
        <div className="h-3 w-20 rounded bg-gray-100" />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex gap-4 border-b border-gray-200 px-4 py-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-3 w-16 rounded bg-gray-100" />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-gray-100 px-4 py-3">
            <div className="h-3 w-16 rounded bg-gray-100" />
            <div className="h-3 w-24 rounded bg-gray-100" />
            <div className="h-3 w-16 rounded bg-gray-100" />
            <div className="h-3 w-12 rounded bg-gray-100" />
            <div className="h-3 w-12 rounded bg-gray-100" />
            <div className="h-3 w-12 rounded bg-gray-100" />
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="h-5 w-14 rounded-full bg-gray-100" />
            <div className="h-3 w-16 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
