# Example Usage

## Basic Setup

```typescript
// payload.config.ts
import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { seoRankMathPlugin } from '@payloadcms/plugin-seo-rankmath'

export default buildConfig({
  collections: [
    {
      slug: 'pages',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'richText',
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          type: 'richText',
        },
        {
          name: 'excerpt',
          type: 'textarea',
        },
        {
          name: 'author',
          type: 'text',
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      slug: 'media',
      upload: true,
      fields: [],
    },
  ],
  plugins: [
    seoRankMathPlugin({
      collections: ['pages', 'posts'],
      uploadsCollection: 'media',
      tabbedUI: true,

      focusKeywordEnabled: true,
      contentAnalysisEnabled: true,
      readabilityAnalysisEnabled: true,

      schemaEnabled: true,
      defaultSchemaType: 'Article',

      sitemap: {
        enabled: true,
        collections: ['pages', 'posts'],
        priority: 0.7,
        changefreq: 'weekly',
      },

      openGraph: {
        enabled: true,
        siteName: 'My Awesome Site',
        siteUrl: 'https://mysite.com',
      },

      twitterCard: {
        enabled: true,
        cardType: 'summary_large_image',
        site: '@mysite',
      },

      generateTitle: ({ doc }) => {
        return doc?.title ? `${doc.title} | My Site` : 'My Site'
      },

      generateDescription: ({ doc }) => {
        return doc?.excerpt || doc?.description || 'Default description'
      },

      generateURL: ({ doc, collectionConfig }) => {
        const slug = doc?.slug || doc?.id
        return `https://mysite.com/${collectionConfig?.slug}/${slug}`
      },
    }),
  ],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
})
```

## Using the SEO Fields

When editing a document, you'll see these fields in the SEO tab:

### Focus Keyword

Enter your main keyword: "seo optimization"

### SEO Score

The plugin automatically calculates a score (0-100) based on:

- Keyword optimization
- Content quality
- Technical SEO
- Readability

### Meta Information

- **Meta Title**: "Complete Guide to SEO Optimization | My Site" (50-60 chars)
- **Meta Description**: "Learn everything about SEO optimization including keywords, content, technical aspects, and more in this comprehensive guide." (120-160 chars)

### Schema Markup

- **Type**: Article
- **Custom JSON-LD**: (optional advanced customization)

### Open Graph

- **OG Title**: "Complete Guide to SEO Optimization"
- **OG Description**: "Master SEO with our comprehensive guide"
- **OG Image**: [Select an image]

### Twitter Card

- **Twitter Title**: "Complete Guide to SEO Optimization"
- **Twitter Description**: "Master SEO with our comprehensive guide"
- **Card Type**: Summary Large Image
- **Twitter Image**: [Select an image]

## Analysis Example

When you save a document with this content:

```markdown
# Complete Guide to SEO Optimization

SEO optimization is crucial for any website. In this guide, we'll cover everything you need to know about SEO optimization.

## Why SEO Optimization Matters

SEO optimization helps your website rank better in search engines. Good SEO optimization can increase traffic by 300%.

## Best Practices for SEO Optimization

1. Use your focus keyword naturally
2. Write quality content over 300 words
3. Include images with alt text
4. Add internal and external links
5. Structure your content with headings
```

The plugin will analyze:

### Keyword Analysis (Focus: "seo optimization")

- ✅ In title: Yes
- ✅ In first paragraph: Yes
- ✅ In H1: Yes
- ✅ In H2: Yes (2 occurrences)
- ✅ Density: 4.2% (⚠️ Too high, reduce to 1.5-2.5%)
- ⚠️ In URL: No
- ⚠️ In alt text: No images found

**Score**: 18/25

### Content Analysis

- ✅ Word count: 78 words (⚠️ Should be 300+)
- ✅ H1 headings: 1
- ✅ H2 headings: 2
- ⚠️ Images: 0
- ⚠️ Internal links: 0
- ⚠️ External links: 0

**Score**: 8/15

### Technical SEO

- ✅ Meta title: 52 characters (optimal)
- ✅ Meta description: 145 characters (optimal)
- ✅ Schema markup: Article
- ⚠️ Open Graph: Incomplete
- ✅ Canonical URL: Set

**Score**: 18/25

### Readability

- ✅ Flesch score: 65 (Standard)
- ✅ Avg sentence length: 12 words
- ✅ Passive voice: 0%
- ⚠️ Transition words: Only 1

**Score**: 7/10

### Total Score: 51/75 (68%) - Needs Improvement 🟠

**Recommendations:**

1. Reduce keyword density from 4.2% to 1.5-2.5%
2. Expand content to at least 300 words
3. Add at least 1 image with alt text
4. Include 2-3 internal links
5. Add 1-2 external links to authoritative sources
6. Complete Open Graph tags
7. Use more transition words

## API Usage Example

```typescript
// Analyze content programmatically
const response = await fetch('/api/plugin-seo-rankmath/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: '<h1>My Page</h1><p>Content here...</p>',
    focusKeyword: 'seo plugin',
    meta: {
      title: 'My Page Title',
      description: 'My page description',
    },
    url: 'https://mysite.com/page',
  }),
})

const { analysis } = await response.json()

console.log('SEO Score:', analysis.score.total)
console.log('Keyword Score:', analysis.keyword.score)
console.log('Recommendations:', analysis.score.recommendations)
```

## Sitemap Usage

Access your sitemap at:

```
https://yoursite.com/api/sitemap.xml
```

Example output:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mysite.com/pages/home</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://mysite.com/posts/my-first-post</loc>
    <lastmod>2024-01-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

## Schema Markup Output

The plugin auto-generates schema markup that appears in your page:

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Complete Guide to SEO Optimization",
    "description": "Learn everything about SEO optimization",
    "author": {
      "@type": "Person",
      "name": "John Doe"
    },
    "datePublished": "2024-01-15T10:00:00Z",
    "dateModified": "2024-01-15T15:30:00Z",
    "image": "https://mysite.com/images/seo-guide.jpg"
  }
</script>
```

## Tips for Best Scores

1. **Focus Keyword**
   - Use naturally in title, description, and headings
   - Aim for 1.5-2.5% density
   - Include in URL slug
   - Add to image alt texts

2. **Content Length**
   - Minimum: 300 words
   - Recommended: 600+ words
   - For competitive keywords: 1000+ words

3. **Headings**
   - Use exactly 1 H1
   - Include 2-3 H2 headings
   - Use H3-H6 for sub-sections

4. **Images**
   - Add at least 1 relevant image
   - Always include descriptive alt text
   - Include focus keyword in alt text when natural

5. **Links**
   - Add 2-3 internal links to related content
   - Add 1-2 external links to authoritative sources
   - Use descriptive anchor text

6. **Readability**
   - Keep sentences under 20 words
   - Avoid passive voice
   - Use transition words (however, therefore, moreover)
   - Target Flesch score of 60-70

7. **Meta Tags**
   - Title: 50-60 characters
   - Description: 120-160 characters
   - Include focus keyword in both

8. **Schema Markup**
   - Select appropriate schema type
   - Add relevant structured data
   - Validate with Google's Rich Results Test

By following these guidelines, you can achieve SEO scores of 85+ (Excellent)!
