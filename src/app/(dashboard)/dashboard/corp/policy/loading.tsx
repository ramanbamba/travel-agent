export default function PolicyLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="h-7 w-36 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-64 rounded bg-gray-100" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-gray-200" />
      </div>

      {/* Policy preview */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="h-4 w-28 rounded bg-blue-100" />
        <div className="mt-2 h-3 w-full rounded bg-blue-100" />
      </div>

      {/* Enforcement mode */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-3 h-4 w-36 rounded bg-gray-200" />
        <div className="flex gap-3">
          <div className="h-16 flex-1 rounded-lg bg-gray-100" />
          <div className="h-16 flex-1 rounded-lg bg-gray-100" />
        </div>
      </div>

      {/* Policy cards */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-3">
            <div className="h-4 w-4 rounded bg-gray-200" />
            <div className="h-4 w-28 rounded bg-gray-200" />
          </div>
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1.5 h-3 w-24 rounded bg-gray-100" />
                <div className="h-9 w-full rounded-lg bg-gray-100" />
              </div>
              <div>
                <div className="mb-1.5 h-3 w-28 rounded bg-gray-100" />
                <div className="h-9 w-full rounded-lg bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
