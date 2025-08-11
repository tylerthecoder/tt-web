import { Metadata, ResolvingMetadata } from "next";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns'; // Using format for a specific date string
import { FaCalendarAlt } from 'react-icons/fa';
import { getBlog, getBlogMetadata } from "../actions";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  props: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const blog = await getBlogMetadata(params.id);

  if ("error" in blog) {
    return {
      title: "Blog not found"
    };
  }

  return {
    title: blog.title
  };
}

export default async function Page(props: Props) {
  const params = await props.params;
  const blog = await getBlog(params.id);

  if ("error" in blog) {
    return <div className="text-white p-8">Error loading blog post.</div>;
  }

  return (
    <div className="w-full flex justify-center p-8 bg-gray-900 min-h-screen">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-blue-300"> {blog.title} </h1>
        {blog.createdAt && (
          <div className="flex items-center text-gray-400 mb-8 text-sm">
            <FaCalendarAlt className="mr-2" />
            Published on {format(new Date(blog.createdAt), 'MMMM d, yyyy')}
          </div>
        )}
        <article
          className="prose prose-stone prose-invert lg:prose-xl max-w-none text-gray-200"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {blog.content || "*No content available.*"}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
