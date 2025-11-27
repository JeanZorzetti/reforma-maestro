import Script from "next/script";

export function SchemaMarkup() {
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Reforma Maestro",
        "url": "https://financeiro-obras.roilabs.com.br",
        "logo": "https://financeiro-obras.roilabs.com.br/images/logo.png", // Placeholder if no logo exists yet
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
        "@type": "Product",
        "name": "Planilha de Orçamento de Obra e Reforma",
        "image": [
            "https://financeiro-obras.roilabs.com.br/images/hero-dashboard.png" // Placeholder
        ],
        "description": "Sistema completo de gestão financeira para obras e reformas em Excel. Controle gastos, cronograma e evite prejuízos.",
        "brand": {
            "@type": "Brand",
            "name": "Reforma Maestro"
        },
        "offers": {
            "@type": "Offer",
            "url": "https://financeiro-obras.roilabs.com.br/#pricing",
            "priceCurrency": "BRL",
            "price": "47.90",
            "priceValidUntil": "2025-12-31",
            "availability": "https://schema.org/InStock"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "124"
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
