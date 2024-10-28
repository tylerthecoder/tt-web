import { Metadata, ResolvingMetadata } from "next";
import { BlogService } from "../service";

type Props = {
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const blog = await BlogService.getBlog(params.id);

  if ("error" in blog) {
    return {
      title: "Blog not found"
    };
  }

  return {
    title: blog.title
  };
}

export default async function Page({ params }: Props) {
  const blog = await BlogService.getBlog(params.id);
  const html = await BlogService.getBlogHtml(params.id);

  return (
    <div className="w-full flex justify-center">
      <div className="math math-display">
        <h2 className="text-4xl mb-10 text-white"> {blog.title} </h2>
        <article
          className="text-white prose prose-stone prose-invert"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
