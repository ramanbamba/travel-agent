export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6">
      {/* Header */}
      <div>
        <div className="h-7 w-28 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-48 rounded bg-gray-100" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="h-3 w-24 rounded bg-gray-100" />
            <div className="mt-2 h-7 w-20 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-4 h-4 w-32 rounded bg-gray-200" />
          <div className="h-60 rounded bg-gray-50" />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-4 h-4 w-40 rounded bg-gray-200" />
          <div className="h-60 rounded bg-gray-50" />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-4 h-4 w-36 rounded bg-gray-200" />
          <div className="h-48 rounded bg-gray-50" />
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-4 h-4 w-32 rounded bg-gray-200" />
          <div className="h-48 rounded bg-gray-50" />
        </div>
      </div>

      {/* Top travelers table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="h-4 w-28 rounded bg-gray-200" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-gray-100 px-4 py-3">
            <div className="h-4 w-28 rounded bg-gray-100" />
            <div className="h-3 w-24 rounded bg-gray-100" />
            <div className="h-3 w-12 rounded bg-gray-100" />
            <div className="h-4 w-20 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
