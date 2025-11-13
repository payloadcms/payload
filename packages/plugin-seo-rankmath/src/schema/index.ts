/**
 * Schema.org JSON-LD generators
 */

import type { GenerateContext, OrganizationSchema, SchemaMarkup, SchemaType } from '../types.js'

/**
 * Generate Article schema
 */
export function generateArticleSchema(args: {
  title: string
  description?: string
  author?: string | { name: string; url?: string }
  datePublished?: string
  dateModified?: string
  image?: string
  url?: string
}): SchemaMarkup {
  const { title, description, author, datePublished, dateModified, image, url } = args

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    ...(description && { description }),
    ...(author && {
      author:
        typeof author === 'string'
          ? { '@type': 'Person', name: author }
          : {
              '@type': 'Person',
              name: author.name,
              ...(author.url && { url: author.url }),
            },
    }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    ...(image && { image }),
    ...(url && { url }),
  }
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(org: OrganizationSchema): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    url: org.url,
    ...(org.logo && { logo: org.logo }),
    ...(org.description && { description: org.description }),
    ...(org.sameAs && { sameAs: org.sameAs }),
    ...(org.contactPoint && { contactPoint: org.contactPoint }),
  }
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>,
): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Generate WebPage schema
 */
export function generateWebPageSchema(args: {
  title: string
  description?: string
  url?: string
  datePublished?: string
  dateModified?: string
}): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: args.title,
    ...(args.description && { description: args.description }),
    ...(args.url && { url: args.url }),
    ...(args.datePublished && { datePublished: args.datePublished }),
    ...(args.dateModified && { dateModified: args.dateModified }),
  }
}

/**
 * Generate Product schema
 */
export function generateProductSchema(args: {
  name: string
  description?: string
  image?: string
  brand?: string
  sku?: string
  price?: number
  priceCurrency?: string
  availability?: string
}): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: args.name,
    ...(args.description && { description: args.description }),
    ...(args.image && { image: args.image }),
    ...(args.brand && { brand: { '@type': 'Brand', name: args.brand } }),
    ...(args.sku && { sku: args.sku }),
    ...(args.price && {
      offers: {
        '@type': 'Offer',
        price: args.price,
        priceCurrency: args.priceCurrency || 'USD',
        availability: args.availability || 'https://schema.org/InStock',
      },
    }),
  }
}

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Auto-generate schema based on document type
 */
export function autoGenerateSchema(context: GenerateContext): SchemaMarkup | null {
  const { doc, collectionConfig } = context

  // Try to determine schema type from collection
  if (!collectionConfig) return null

  const slug = collectionConfig.slug.toLowerCase()

  // Article-like collections
  if (slug.includes('post') || slug.includes('article') || slug.includes('blog')) {
    return generateArticleSchema({
      title: doc.title || doc.name || '',
      description: doc.description || doc.excerpt || '',
      author: doc.author?.name || doc.author,
      datePublished: doc.createdAt || doc.publishedAt,
      dateModified: doc.updatedAt,
      image: doc.featuredImage?.url || doc.image?.url,
      url: doc.url,
    })
  }

  // Product collections
  if (slug.includes('product')) {
    return generateProductSchema({
      name: doc.name || doc.title || '',
      description: doc.description || '',
      image: doc.image?.url || doc.images?.[0]?.url,
      brand: doc.brand,
      sku: doc.sku,
      price: doc.price,
      priceCurrency: doc.currency,
    })
  }

  // Default to WebPage
  return generateWebPageSchema({
    title: doc.title || doc.name || '',
    description: doc.description || '',
    url: doc.url,
    datePublished: doc.createdAt || doc.publishedAt,
    dateModified: doc.updatedAt,
  })
}
