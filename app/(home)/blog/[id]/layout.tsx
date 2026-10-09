/* eslint-disable @next/next/no-html-link-for-pages */

import BlogSidebar from '../blog-sidebar';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <BlogSidebar />
    </div>
  );
}
