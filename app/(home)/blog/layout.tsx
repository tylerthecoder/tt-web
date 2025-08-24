export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 h-full">
      <div className="flex flex-col h-full max-w-[800px] m-auto">
        <div className="p-5 flex-grow">{children}</div>
      </div>
    </div>
  );
}
