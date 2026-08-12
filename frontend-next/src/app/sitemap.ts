import { MetadataRoute } from 'next'
import { blogPosts } from '@/data/blog-posts'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://orcaobra.roilabs.com.br'

    const posts = blogPosts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }))

    // Sem `lastModified` nas páginas estáticas: o sitemap é prerenderizado no
    // build, então `new Date()` gravava a data do deploy e dizia ao Google que
    // toda página mudou a cada deploy. Data ausente é melhor que data errada.
    // Os artigos mantêm a sua, que é real (`post.date`).
    return [
        {
            url: baseUrl,
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/sobre`,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/blog`,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        ...posts,
        {
            url: `${baseUrl}/privacidade`,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ]
}
