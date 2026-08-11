import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/private/',
                '/app',
                '/entrar',
                '/cadastrar',
                '/recuperar-senha',
                '/redefinir-senha',
                '/api',
            ],
        },
        sitemap: 'https://orcaobra.roilabs.com.br/sitemap.xml',
    }
}
