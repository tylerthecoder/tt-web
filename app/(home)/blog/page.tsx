import Link from 'next/link';

import { getBlogs } from './actions';

export default async function Page() {
  const blogs = await getBlogs();

  return (
    <div className="prose prose-stone prose-invert">
      <h1> All Blog Posts </h1>
      <p> I write about AI, Philosophy, and Technology </p>

      <h3> AI Control </h3>
      <ul>
        <li>
          {' '}
          <Link href="/blog/67f8401d0b9bbcfb66f2d1f3"> High Stakes Control Research </Link>{' '}
        </li>
      </ul>

      <h3> Random </h3>
      <ul>
        {blogs.map((blog) => (
          <li key={blog.id}>
            <Link href="/blog/[id]" as={`/blog/${blog.id}`} className="text-white">
              {blog.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
