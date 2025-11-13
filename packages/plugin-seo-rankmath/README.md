# @payloadcms/plugin-seo-rankmath

Advanced SEO plugin for Payload CMS with RankMath-like features including SEO scoring, keyword optimization, content analysis, schema markup, XML sitemaps, and more.

## Features

- **🎯 SEO Scoring System** (0-100) - Get real-time SEO scores for your content
- **🔑 Keyword Optimization** - Focus keyword tracking with density analysis
- **📝 Content Analysis** - Word count, readability, heading structure
- **📖 Readability Scoring** - Flesch Reading Ease and Flesch-Kincaid Grade Level
- **🏗️ Schema.org Markup** - Auto-generate JSON-LD structured data
- **🗺️ XML Sitemap Generation** - Automatic sitemap creation
- **📱 Social Media Optimization** - Open Graph and Twitter Card support
- **⚡ Real-time Analysis** - Analyze content as you type
- **🌐 Multi-language Support** - Works with Payload's localization
- **🎨 Customizable** - Flexible configuration and scoring weights

## Installation

```bash
pnpm add @payloadcms/plugin-seo-rankmath
```

## Quick Start

### Basic Configuration

```typescript
import { buildConfig } from 'payload'
import { seoRankMathPlugin } from '@payloadcms/plugin-seo-rankmath'

export default buildConfig({
  plugins: [
    seoRankMathPlugin({
      collections: ['pages', 'posts'],
      uploadsCollection: 'media',
      tabbedUI: true,
    }),
  ],
})
```

### Advanced Configuration

```typescript
seoRankMathPlugin({
  // Collections to add SEO fields to
  collections: ['pages', 'posts', 'products'],
  globals: ['settings'],

  // Upload collection for images
  uploadsCollection: 'media',

  // UI Options
  tabbedUI: true,
  showScore: true,
  showAnalysis: true,
  realTimeAnalysis: true,

  // Feature Toggles
  focusKeywordEnabled: true,
  contentAnalysisEnabled: true,
  readabilityAnalysisEnabled: true,

  // Custom Scoring Weights (must add up to 100)
  scoring: {
    keyword: 25, // Keyword optimization (default: 25)
    content: 25, // Content quality (default: 25)
    technical: 25, // Technical SEO (default: 25)
    readability: 25, // Readability (default: 25)
  },

  // Schema Markup
  schemaEnabled: true,
  defaultSchemaType: 'Article',
  organizationSchema: {
    name: 'Your Company',
    url: 'https://yoursite.com',
    logo: 'https://yoursite.com/logo.png',
  },

  // XML Sitemap
  sitemap: {
    enabled: true,
    collections: ['pages', 'posts'],
    priority: 0.7,
    changefreq: 'weekly',
    generateImages: true,
  },

  // Open Graph
  openGraph: {
    enabled: true,
    defaultImage: 'https://yoursite.com/og-default.jpg',
    siteName: 'Your Site Name',
    siteUrl: 'https://yoursite.com',
  },

  // Twitter Cards
  twitterCard: {
    enabled: true,
    cardType: 'summary_large_image',
    site: '@yourhandle',
    creator: '@creatorhandle',
  },

  // Auto-generation functions
  generateTitle: ({ doc }) => doc?.title || '',
  generateDescription: ({ doc }) => doc?.excerpt || '',
  generateURL: ({ doc, collectionConfig }) =>
    `https://yoursite.com/${collectionConfig?.slug}/${doc?.slug}`,
})
```

## SEO Scoring Breakdown

The plugin calculates a comprehensive SEO score (0-100) based on four categories:

### 1. Keyword Optimization (25 points)

- ✅ Keyword in title (5 pts)
- ✅ Keyword in description (3 pts)
- ✅ Keyword in H1 heading (4 pts)
- ✅ Keyword in H2-H4 headings (3 pts)
- ✅ Keyword density 0.5-2.5% (5 pts)
- ✅ Keyword in URL (3 pts)
- ✅ Keyword in image alt text (2 pts)

### 2. Content Quality (25 points)

- ✅ Word count >300 words (5 pts)
- ✅ Proper heading structure (5 pts)
- ✅ Images with alt text (5 pts)
- ✅ Internal links (3 pts)
- ✅ External links (2 pts)
- ✅ Paragraph length (5 pts)

### 3. Technical SEO (25 points)

- ✅ Meta title 50-60 characters (7 pts)
- ✅ Meta description 120-160 characters (7 pts)
- ✅ Schema markup present (5 pts)
- ✅ Open Graph tags (3 pts)
- ✅ Canonical URL (3 pts)

### 4. Readability (25 points)

- ✅ Flesch Reading Ease score >60 (10 pts)
- ✅ Average sentence length <20 words (5 pts)
- ✅ Passive voice <10% (5 pts)
- ✅ Transition words present (5 pts)

## Score Levels

- **86-100**: 🟢 **Excellent** - Highly optimized
- **71-85**: 🟡 **Good** - Well optimized
- **41-70**: 🟠 **Needs Improvement** - Requires optimization
- **0-40**: 🔴 **Poor** - Significant improvements needed

## Fields Added

The plugin automatically adds these fields to your collections:

```typescript
{
  seoRankMath: {
    // Core SEO
    focusKeyword: string
    seoScore: number(read - only)
    metaTitle: string
    metaDescription: string
    canonicalURL: string

    // Schema
    schemaType: select
    schemaMarkup: json

    // Open Graph
    ogTitle: string
    ogDescription: string
    ogImage: upload

    // Twitter Card
    twitterTitle: string
    twitterDescription: string
    twitterCardType: select
    twitterImage: upload

    // Analysis (read-only)
    seoAnalysis: json
  }
}
```

## API Endpoints

### Analyze Content

```typescript
POST /api/plugin-seo-rankmath/analyze

// Request
{
  "content": "<p>Your HTML content here...</p>",
  "focusKeyword": "your keyword",
  "meta": {
    "title": "Page Title",
    "description": "Meta description"
  },
  "url": "https://yoursite.com/page"
}

// Response
{
  "success": true,
  "analysis": {
    "score": {
      "total": 85,
      "breakdown": {
        "keyword": 22,
        "content": 20,
        "technical": 23,
        "readability": 20
      },
      "issues": [...],
      "recommendations": [...]
    },
    "keyword": { ... },
    "content": { ... },
    "technical": { ... }
  }
}
```

### XML Sitemap

```
GET /api/sitemap.xml
```

Returns an XML sitemap with all published documents from configured collections.

## Schema Markup

The plugin can auto-generate Schema.org JSON-LD markup:

```typescript
import { generateArticleSchema } from '@payloadcms/plugin-seo-rankmath/utilities'

const schema = generateArticleSchema({
  title: 'Article Title',
  description: 'Article description',
  author: 'Author Name',
  datePublished: '2024-01-01',
  dateModified: '2024-01-15',
  image: 'https://example.com/image.jpg',
  url: 'https://example.com/article',
})
```

### Available Schema Generators

- `generateArticleSchema()` - Article/Blog/News
- `generateOrganizationSchema()` - Organization info
- `generateBreadcrumbSchema()` - Breadcrumb navigation
- `generateWebPageSchema()` - Generic web page
- `generateProductSchema()` - Product pages
- `generateFAQSchema()` - FAQ pages
- `autoGenerateSchema()` - Auto-detect and generate

## Manual Field Usage

You can use individual analysis functions without the full plugin:

```typescript
import { analyzeSEO } from '@payloadcms/plugin-seo-rankmath'

const result = analyzeSEO({
  content: '<p>Your content...</p>',
  focusKeyword: 'seo plugin',
  meta: {
    title: 'My Page Title',
    description: 'My meta description',
  },
})

console.log(result.score.total) // 85
console.log(result.recommendations) // Array of recommendations
```

## Customization

### Custom Fields

```typescript
seoRankMathPlugin({
  fields: ({ defaultFields }) => [
    ...defaultFields,
    {
      name: 'customSEOField',
      type: 'text',
      label: 'Custom SEO Field',
    },
  ],
})
```

### Custom Scoring Weights

```typescript
seoRankMathPlugin({
  scoring: {
    keyword: 30, // More weight on keywords
    content: 20,
    technical: 20,
    readability: 5, // Less weight on readability
  },
})
```

### Custom Content Rules

```typescript
seoRankMathPlugin({
  readability: {
    targetScore: 70, // Higher readability target
    maxSentenceLength: 15, // Shorter sentences
    maxParagraphLength: 4, // Shorter paragraphs
  },
  keywordDensity: {
    min: 1.0,
    max: 3.0,
    optimal: 2.0,
  },
})
```

## TypeScript Support

The plugin is fully typed with TypeScript:

```typescript
import type {
  RankMathPluginConfig,
  SEOScore,
  KeywordAnalysis,
  ContentAnalysis,
  SchemaMarkup,
} from '@payloadcms/plugin-seo-rankmath/types'
```

## Roadmap

- [ ] UI Components for real-time analysis
- [ ] Keyword suggestions
- [ ] Internal linking suggestions
- [ ] Competitor analysis
- [ ] Link checker
- [ ] Image optimization analysis
- [ ] Breadcrumbs with structured data
- [ ] Advanced schema types
- [ ] Google Search Console integration

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.

## License

MIT

## Support

- [Documentation](https://payloadcms.com/docs/plugins/seo-rankmath)
- [GitHub Issues](https://github.com/payloadcms/payload/issues)
- [Discord Community](https://discord.gg/payload)

## Credits

Inspired by [RankMath](https://rankmath.com/) for WordPress, reimagined for Payload CMS with modern, headless architecture.
