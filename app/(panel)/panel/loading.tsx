export default function Loading() {
    return (
        <div className="flex flex-col min-h-screen bg-gray-900">
            {/* Header Placeholder */}
            <div className="p-4 bg-gray-800 bg-opacity-50 animate-pulse">
                <div className="flex justify-between items-center">
                    <div className="h-8 w-64 bg-gray-700 rounded"></div> {/* Title placeholder */}
                    <div className="h-8 w-24 bg-gray-700 rounded"></div> {/* AgeCounter placeholder */}
                </div>
            </div>

            {/* Content Placeholder */}
            <div className="flex flex-col lg:flex-row flex-grow p-4 gap-4 animate-pulse">
                {/* Left Section (Weekly Todos) Placeholder */}
                <div className="w-full lg:w-1/3 bg-gray-800 rounded-lg p-4">
                    <div className="h-6 w-1/2 bg-gray-700 rounded mb-4"></div> {/* Title Placeholder */}
                    <div className="space-y-3">
                        <div className="h-4 w-full bg-gray-700 rounded"></div>
                        <div className="h-4 w-5/6 bg-gray-700 rounded"></div>
                        <div className="h-4 w-3/4 bg-gray-700 rounded"></div>
                        <div className="h-4 w-full bg-gray-700 rounded"></div>
                        <div className="h-4 w-4/6 bg-gray-700 rounded"></div>
                    </div>
                </div>
                {/* Right Section (Editor) Placeholder */}
                <div className="w-full lg:w-2/3 bg-gray-800 rounded-lg p-4">
                    <div className="h-full w-full bg-gray-700 rounded"></div> {/* Editor area placeholder */}
                </div>
            </div>
        </div>
    );
}