export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="h-10 w-36 bg-gray-800 animate-pulse rounded-lg"></div>
        <div className="flex gap-3">
          <div className="w-32 h-10 bg-gray-800 animate-pulse rounded-lg"></div>
          <div className="w-10 h-10 bg-gray-800 animate-pulse rounded-lg"></div>
        </div>
      </div>

      {/* Filter placeholder */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 animate-pulse">
        <div className="h-10 w-full bg-gray-700 rounded-lg mb-4"></div>
        <div className="flex flex-wrap gap-2">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-6 w-16 bg-gray-700 rounded-full"></div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Generate 9 placeholder cards */}
        {Array(9)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="bg-gray-800 rounded-lg shadow-md overflow-hidden h-64 flex flex-col animate-pulse"
            >
              <div className="p-4 border-b border-gray-700">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="p-4 flex-grow">
                <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Array(3)
                      .fill(0)
                      .map((_, j) => (
                        <div key={j} className="h-4 w-12 bg-gray-700 rounded-full"></div>
                      ))}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-900 flex justify-end gap-2">
                {Array(3)
                  .fill(0)
                  .map((_, j) => (
                    <div key={j} className="h-8 w-16 bg-gray-700 rounded"></div>
                  ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
