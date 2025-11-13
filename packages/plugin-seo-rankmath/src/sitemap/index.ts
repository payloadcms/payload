/**
 * XML Sitemap Generator
 */

import type { Payload } from 'payload'
import type { SitemapConfig, SitemapEntry } from '../types.js'

/**
 * Generate XML sitemap
 */
export async function generateSitemap(payload: Payload, config: SitemapConfig): Promise<string> {
  const entries: SitemapEntry[] = []

  // Add custom entries
  if (config.customEntries) {
    entries.push(...config.customEntries)
  }

  // Generate entries from collections
  for (const collectionSlug of config.collections) {
    try {
      const collection = payload.collections[collectionSlug]
      if (!collection) continue

      // Fetch published documents
      const result = await payload.find({
        collection: collectionSlug,
        limit: 1000,
        where: {
          _status: {
            equals: 'published',
          },
        },
      })

      // Add each document to sitemap
      for (const doc of result.docs) {
        const entry: SitemapEntry = {
          loc: generateDocumentURL(doc, collectionSlug, config),
          lastmod: doc.updatedAt || doc.createdAt,
          changefreq: config.changefreq,
          priority: config.priority,
        }

        // Add images if enabled
        if (config.generateImages) {
          entry.images = extractImages(doc)
        }

        entries.push(entry)
      }
    } catch (error) {
      console.error(`Error generating sitemap for collection ${collectionSlug}:`, error)
    }
  }

  // Generate XML
  return generateSitemapXML(entries)
}

/**
 * Generate document URL
 */
function generateDocumentURL(doc: any, collectionSlug: string, config: SitemapConfig): string {
  // Try to get URL from document
  if (doc.url) return doc.url
  if (doc.slug) return `/${collectionSlug}/${doc.slug}`

  // Fallback to ID
  return `/${collectionSlug}/${doc.id}`
}

/**
 * Extract images from document
 */
function extractImages(doc: any): Array<{ loc: string; caption?: string; title?: string }> {
  const images: Array<{ loc: string; caption?: string; title?: string }> = []

  // Check common image fields
  const imageFields = ['image', 'featuredImage', 'thumbnail', 'images', 'gallery', 'media', 'photo']

  for (const field of imageFields) {
    if (doc[field]) {
      const value = doc[field]

      // Single image
      if (value.url) {
        images.push({
          loc: value.url,
          caption: value.alt || value.caption,
          title: value.title || value.filename,
        })
      }

      // Array of images
      if (Array.isArray(value)) {
        for (const img of value) {
          if (img.url) {
            images.push({
              loc: img.url,
              caption: img.alt || img.caption,
              title: img.title || img.filename,
            })
          }
        }
      }
    }
  }

  return images
}

/**
 * Generate XML from entries
 */
function generateSitemapXML(entries: SitemapEntry[]): string {
  const xml: string[] = []

  xml.push('<?xml version="1.0" encoding="UTF-8"?>')
  xml.push(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  )

  for (const entry of entries) {
    xml.push('  <url>')
    xml.push(`    <loc>${escapeXML(entry.loc)}</loc>`)

    if (entry.lastmod) {
      const date = new Date(entry.lastmod).toISOString().split('T')[0]
      xml.push(`    <lastmod>${date}</lastmod>`)
    }

    if (entry.changefreq) {
      xml.push(`    <changefreq>${entry.changefreq}</changefreq>`)
    }

    if (entry.priority !== undefined) {
      xml.push(`    <priority>${entry.priority}</priority>`)
    }

    // Add images
    if (entry.images) {
      for (const image of entry.images) {
        xml.push('    <image:image>')
        xml.push(`      <image:loc>${escapeXML(image.loc)}</image:loc>`)
        if (image.caption) {
          xml.push(`      <image:caption>${escapeXML(image.caption)}</image:caption>`)
        }
        if (image.title) {
          xml.push(`      <image:title>${escapeXML(image.title)}</image:title>`)
        }
        xml.push('    </image:image>')
      }
    }

    xml.push('  </url>')
  }

  xml.push('</urlset>')

  return xml.join('\n')
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
