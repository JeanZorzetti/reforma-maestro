import Script from "next/script";

export function SchemaMarkup() {
    // Sem `sameAs`: só entra aqui perfil que exista de verdade. URL de rede social
    // inventada em structured data é sinal de spam para o Google, não de autoridade.
    const organizationSchema = {
        "@context": "https://schema.org",
        "@id": "https://orcaobra.roilabs.com.br/#organization",
        "@type": "Organization",
        "name": "Reforma Maestro",
        "url": "https://orcaobra.roilabs.com.br",
        "logo": "https://orcaobra.roilabs.com.br/og.png",
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "email": "suporte@roilabs.com.br"
        }
    };

    const productSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Reforma Maestro",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "image": [
            "https://orcaobra.roilabs.com.br/og.png"
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
