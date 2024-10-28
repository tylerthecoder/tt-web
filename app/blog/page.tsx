import Link from "next/link";
import { BlogService } from "./service";

export default async function Page() {
  const blogs = await BlogService.getBlogs();

  return (
    <div className="prose prose-stone prose-invert">
      <h1> All Blog Posts </h1>
      <p> I write about AI, Philosophy, and Technology </p>
      {blogs.map(blog => (
        <div key={blog.id}>
          <Link
            href="/blog/[id]"
            as={`/blog/${blog.id}`}
            className="text-white"
          >
            - {blog.title}
          </Link>
        </div>
      ))}
    </div>
  );
}
