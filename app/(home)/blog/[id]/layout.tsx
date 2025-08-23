import "katex/dist/katex.min.css";
import BlogSidebar from "../blog-sidebar";

export default function BlogLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <BlogSidebar />
    </div>
  );
}
