export default function Loading() {
    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Your Google Docs</h1>
                <div className="flex gap-2">
                    {/* Placeholder for buttons */}
                    <div className="w-24 h-10 bg-gray-200 animate-pulse rounded-md"></div>
                    <div className="w-24 h-10 bg-gray-200 animate-pulse rounded-md"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Generate 6 placeholder cards */}
                {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden h-56 flex flex-col animate-pulse">
                        <div className="p-4 border-b border-gray-200">
                            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="p-4 flex-grow">
                            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-between">
                            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}