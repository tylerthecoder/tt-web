import { TylersThings } from "tt-services";


import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import { remark } from "remark";
import html from "remark-html";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";

export default async function markdownToHtml(markdown: string) {
  const result = await remark()
    .use(html)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(markdown);

  return result.toString();
}

export class BlogServiceClass {

  private tylersThings: TylersThings | null = null;

  private async getTylersThings() {
    if (!this.tylersThings) {
      this.tylersThings = await TylersThings.make();
    }
    return this.tylersThings;
  }

  async getBlogs() {
    const tylersThings = await this.getTylersThings();
    const blogs = await tylersThings.notes.getPublishedNotes();
    console.log("Fetched blogs", blogs);
    return blogs;
  }

  async getBlog(id: string) {
    const tylersThings = await this.getTylersThings();
    const blog = await tylersThings.notes.getNoteById(id);
    if (!blog) {
      throw new Error(`Blog with id ${id} not found`);
    }
    return blog;
  }

  async getBlogHtml(id: string) {
    const blog = await this.getBlog(id);
    return markdownToHtml(blog.content);
  }
}

export const BlogService = new BlogServiceClass();
