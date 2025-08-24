export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 animate-pulse">
      <div className="w-full max-w-md p-8 rounded-lg bg-gray-800">
        {/* Title Placeholder */}
        <div className="h-10 w-3/4 mx-auto bg-gray-700 rounded mb-8"></div>

        <div className="space-y-6">
          {/* Label Placeholder */}
          <div className="h-5 w-1/4 bg-gray-700 rounded mb-2"></div>
          {/* Input Placeholder */}
          <div className="h-10 w-full bg-gray-700 rounded"></div>

          {/* Button Placeholder */}
          <div className="h-12 w-full bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}
