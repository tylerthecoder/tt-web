'use server';

import { getTT } from '@/utils/utils';

import markdownToHtml from './utils';

export async function getBlogs() {
  const tylersThings = await getTT();
  const blogs = await tylersThings.notes.getPublishedNotes();
  return blogs.filter((blog) => blog.published === true && !blog.deleted);
}

export async function getBlogMetadata(id: string) {
  const tylersThings = await getTT();
  const blog = await tylersThings.notes.getNoteMetadataById(id);
  if (!blog || blog.published !== true || blog.deleted) {
    throw new Error(`Blog with id ${id} not found`);
  }
  return blog;
}

export async function getBlog(id: string) {
  const tylersThings = await getTT();
  const blog = await tylersThings.notes.getNoteById(id);
  if (!blog || blog.published !== true || blog.deleted) {
    throw new Error(`Blog with id ${id} not found`);
  }
  return blog;
}

export async function getBlogHtml(id: string) {
  const blog = await getBlog(id);
  return markdownToHtml(blog.content);
}
