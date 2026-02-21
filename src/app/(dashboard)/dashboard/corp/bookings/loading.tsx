export default function BookingsLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="h-7 w-28 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-40 rounded bg-gray-100" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-gray-200" />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="h-8 w-16 rounded bg-gray-100" />
        <div className="h-8 w-24 rounded-lg bg-gray-100" />
        <div className="h-8 w-28 rounded-lg bg-gray-100" />
        <div className="h-8 w-28 rounded-lg bg-gray-100" />
        <div className="h-8 w-28 rounded-lg bg-gray-100" />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {/* Header row */}
        <div className="flex gap-4 border-b border-gray-200 px-4 py-3">
          {["w-16", "w-24", "w-24", "w-20", "w-20", "w-20", "w-12", "w-16"].map((w, i) => (
            <div key={i} className={`h-3 ${w} rounded bg-gray-100`} />
          ))}
        </div>
        {/* Rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-gray-100 px-4 py-3">
            <div className="h-3 w-16 rounded bg-gray-100" />
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-3 w-24 rounded bg-gray-100" />
            <div className="h-3 w-20 rounded bg-gray-100" />
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="h-5 w-16 rounded-full bg-gray-100" />
            <div className="h-4 w-6 rounded bg-gray-100" />
            <div className="h-5 w-14 rounded-full bg-gray-100" />
          </div>
        ))}
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <div className="h-3 w-40 rounded bg-gray-100" />
          <div className="flex gap-1">
            <div className="h-7 w-7 rounded bg-gray-100" />
            <div className="h-7 w-7 rounded bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
