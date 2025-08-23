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
        // .use(rehypeKatex)
        .use(rehypeStringify)
        .process(markdown);

    return result.toString();
}