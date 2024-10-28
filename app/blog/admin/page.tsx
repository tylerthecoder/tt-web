import { revalidateTag } from "next/cache";
import { BlogService } from "../service";

export default async function Page() {
  async function revalidate() {
    "use server";
    console.log("Revalidating blogs");
    revalidateTag("blog");
  }

  async function repull() {
    "use server";
    // BlogService.repullBlogs();
  }

  return (
    <div>
      <form action={revalidate}>
        <button type="submit"> Revalidate Blogs </button>;
      </form>
      <form action={repull}>
        <button type="submit"> Repull Blogs </button>;
      </form>
    </div>
  );
}
