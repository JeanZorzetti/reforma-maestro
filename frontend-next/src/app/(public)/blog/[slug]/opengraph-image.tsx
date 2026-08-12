import { blogPosts } from "@/data/blog-posts";
import { ogImage, ogSize, ogContentType } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  return ogImage({
    eyebrow: post?.category ?? "Blog",
    title: post?.title ?? "Reforma Maestro",
    description: post?.excerpt,
  });
}
