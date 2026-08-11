import Script from "next/script";

export function SchemaMarkup() {
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Reforma Maestro",
        "url": "https://orcaobra.roilabs.com.br",
        "logo": "https://orcaobra.roilabs.com.br/images/logo.png", // Placeholder if no logo exists yet
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "email": "suporte@roilabs.com.br"
        },
        "sameAs": [
            "https://www.instagram.com/reforma.maestro" // Placeholder
        ]
    };

    const productSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Reforma Maestro",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "image": [
            "https://orcaobra.roilabs.com.br/images/hero-dashboard.png" // Placeholder
        ],
        "description": "App de controle financeiro para obras e reformas. Cadastre a obra, lance os gastos e acompanhe o orçamento em um painel automático.",
        "brand": {
            "@type": "Brand",
            "name": "Reforma Maestro"
        },
        "offers": {
            "@type": "Offer",
            "url": "https://orcaobra.roilabs.com.br/#pricing",
            "priceCurrency": "BRL",
            "price": "47.90",
            "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "price": "47.90",
                "priceCurrency": "BRL",
                "billingDuration": "P1M"
            },
            "availability": "https://schema.org/InStock"
        }
    };

    return (
        <>
            <Script id="schema-organization" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(organizationSchema)}
            </Script>
            <Script id="schema-product" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(productSchema)}
            </Script>
        </>
    );
}
