import React from "react";
import { Helmet } from "react-helmet-async";

const SITE_NAME = "BritBooks";
const BASE_URL = "https://www.britbooks.co.uk";
const DEFAULT_IMAGE = `${BASE_URL}/logobritr.png`;
const DEFAULT_DESCRIPTION =
  "Shop thousands of quality second-hand and new books at BritBooks — affordable prices, fast UK delivery, and sustainable reading for everyone.";

export interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: "website" | "book" | "article";
  noindex?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
  // Book-specific
  author?: string;
  isbn?: string;
  price?: string;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  condition?: string;
  category?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  structuredData,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const resolvedImage = image?.startsWith("http") ? image : `${BASE_URL}${image}`;
  const canonicalUrl = canonical
    ? canonical.startsWith("http")
      ? canonical
      : `${BASE_URL}${canonical}`
    : typeof window !== "undefined"
    ? window.location.href
    : BASE_URL;

  return (
    <Helmet>
      {/* Primary */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type === "book" ? "product" : type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={resolvedImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_GB" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImage} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(structuredData) ? structuredData : structuredData
          )}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;

/* ─── Helpers ────────────────────────────────────────────────────────── */

export const buildBookSchema = ({
  id,
  title,
  author,
  description,
  image,
  isbn,
  price,
  condition,
  availability,
  category,
}: {
  id: string;
  title: string;
  author: string;
  description?: string;
  image?: string;
  isbn?: string;
  price?: number;
  condition?: string;
  availability?: "InStock" | "OutOfStock";
  category?: string;
}): Record<string, unknown>[] => {
  const conditionMap: Record<string, string> = {
    New: "https://schema.org/NewCondition",
    "Like New": "https://schema.org/LikeNewCondition",
    Good: "https://schema.org/GoodCondition",
    Fair: "https://schema.org/FairCondition",
    Poor: "https://schema.org/DamagedCondition",
  };

  const bookSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: title,
    author: { "@type": "Person", name: author },
    ...(description && { description }),
    ...(isbn && { isbn }),
    ...(image && { image }),
    ...(category && { genre: category }),
    url: `https://www.britbooks.co.uk/browse/${id}`,
  };

  const offerSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    ...(description && { description }),
    ...(image && { image }),
    ...(isbn && { gtin13: isbn }),
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: price?.toFixed(2),
      availability: availability === "InStock"
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      ...(condition && conditionMap[condition] && {
        itemCondition: conditionMap[condition],
      }),
      url: `https://www.britbooks.co.uk/browse/${id}`,
      seller: {
        "@type": "Organization",
        name: "BritBooks",
        url: "https://www.britbooks.co.uk",
      },
    },
  };

  return [bookSchema, offerSchema];
};

export const buildBreadcrumbSchema = (
  crumbs: { name: string; url: string }[]
): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: c.url.startsWith("http") ? c.url : `https://www.britbooks.co.uk${c.url}`,
  })),
});

export const buildOrganizationSchema = (): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BritBooks",
  url: "https://www.britbooks.co.uk",
  logo: "https://www.britbooks.co.uk/logobritr.png",
  description: DEFAULT_DESCRIPTION,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: "English",
  },
  sameAs: [
    "https://www.facebook.com/britbooks",
    "https://www.twitter.com/britbooks",
    "https://www.instagram.com/britbooks",
  ],
});
