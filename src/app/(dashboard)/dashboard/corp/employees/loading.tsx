export default function EmployeesLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="h-7 w-32 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-56 rounded bg-gray-100" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-gray-200" />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="h-9 flex-1 rounded-lg bg-gray-100" />
        <div className="h-9 w-28 rounded-lg bg-gray-100" />
        <div className="h-9 w-28 rounded-lg bg-gray-100" />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {/* Header row */}
        <div className="flex gap-4 border-b border-gray-200 px-4 py-3">
          {["w-24", "w-40", "w-24", "w-20", "w-20", "w-16", "w-20", "w-16"].map((w, i) => (
            <div key={i} className={`h-3 ${w} rounded bg-gray-100`} />
          ))}
        </div>
        {/* Rows */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div className="h-4 w-28 rounded bg-gray-100" />
            </div>
            <div className="h-3 w-36 rounded bg-gray-100" />
            <div className="h-3 w-20 rounded bg-gray-100" />
            <div className="h-5 w-16 rounded-full bg-gray-100" />
            <div className="h-3 w-16 rounded bg-gray-100" />
            <div className="h-3 w-8 rounded bg-gray-100" />
            <div className="h-5 w-14 rounded-full bg-gray-100" />
            <div className="h-3 w-10 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
