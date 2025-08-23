import Link from "next/link";
import { getBlogs } from "./actions";

export default async function BlogSidebar() {
  const blogs = await getBlogs();

  return (
    <div className="mt-10 text-white px-5 py-2 border-t-4 border-black m-r-4 h-auto min-w-[250px] flex flex-col gap-2">
      <h3 className="text-xl"> Other Posts </h3>
      {blogs.map(blog => (
        <div key={blog.id}>
          <Link href="/blog/[id]" as={`/blog/${blog.id}`}>
            - {blog.title}
          </Link>
        </div>
      ))}
    </div>
  );
}
