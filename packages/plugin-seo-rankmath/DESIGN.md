# Plugin SEO RankMath - Thiết Kế Kiến Trúc

## Tổng Quan

Plugin SEO nâng cao cho Payload CMS, cung cấp tính năng tương tự RankMath:

- **SEO Scoring**: Đánh giá và chấm điểm SEO (0-100)
- **Keyword Optimization**: Tối ưu từ khóa, phân tích mật độ
- **Content Analysis**: Phân tích nội dung, readability
- **Schema Markup**: JSON-LD structured data
- **XML Sitemap**: Tự động tạo sitemap
- **Breadcrumbs**: Breadcrumb với structured data
- **Social Media**: Open Graph và Twitter Cards nâng cao

## Cấu Trúc Thư Mục

```
packages/plugin-seo-rankmath/
├── src/
│   ├── index.ts                      # Main plugin export
│   ├── types.ts                      # TypeScript types
│   ├── defaults.ts                   # Default configuration
│   │
│   ├── analysis/                     # SEO Analysis Engine
│   │   ├── index.ts                  # Main analyzer
│   │   ├── scoring.ts                # Scoring algorithms
│   │   ├── keyword.ts                # Keyword analysis
│   │   ├── content.ts                # Content analysis
│   │   ├── readability.ts            # Readability scoring
│   │   └── types.ts                  # Analysis types
│   │
│   ├── schema/                       # Schema.org Markup
│   │   ├── index.ts                  # Schema generator
│   │   ├── article.ts                # Article schema
│   │   ├── organization.ts           # Organization schema
│   │   ├── breadcrumb.ts             # Breadcrumb schema
│   │   ├── product.ts                # Product schema
│   │   ├── faq.ts                    # FAQ schema
│   │   └── types.ts                  # Schema types
│   │
│   ├── sitemap/                      # XML Sitemap
│   │   ├── index.ts                  # Sitemap generator
│   │   ├── builder.ts                # XML builder
│   │   └── types.ts                  # Sitemap types
│   │
│   ├── breadcrumbs/                  # Breadcrumbs
│   │   ├── index.ts                  # Breadcrumb generator
│   │   ├── builder.ts                # Breadcrumb builder
│   │   └── types.ts                  # Breadcrumb types
│   │
│   ├── fields/                       # Custom Fields
│   │   ├── FocusKeyword/
│   │   │   ├── index.ts
│   │   │   └── FocusKeywordComponent.tsx
│   │   ├── SEOScore/
│   │   │   ├── index.ts
│   │   │   └── SEOScoreComponent.tsx
│   │   ├── ContentAnalysis/
│   │   │   ├── index.ts
│   │   │   └── ContentAnalysisComponent.tsx
│   │   ├── SchemaMarkup/
│   │   │   ├── index.ts
│   │   │   └── SchemaMarkupComponent.tsx
│   │   ├── OpenGraph/
│   │   │   ├── index.ts
│   │   │   └── OpenGraphComponent.tsx
│   │   ├── TwitterCard/
│   │   │   ├── index.ts
│   │   │   └── TwitterCardComponent.tsx
│   │   └── SocialPreview/
│   │       ├── index.ts
│   │       └── SocialPreviewComponent.tsx
│   │
│   ├── ui/                           # UI Components
│   │   ├── SEOScoreGauge.tsx         # Score gauge (0-100)
│   │   ├── KeywordDensity.tsx        # Keyword density display
│   │   ├── ContentChecklist.tsx      # SEO checklist
│   │   ├── ReadabilityScore.tsx      # Readability gauge
│   │   ├── SchemaEditor.tsx          # Schema JSON editor
│   │   └── SocialPreview.tsx         # Social media preview
│   │
│   ├── hooks/                        # Payload Hooks
│   │   ├── beforeChange.ts           # Auto-generate SEO data
│   │   ├── afterChange.ts            # Update sitemap
│   │   └── beforeDelete.ts           # Remove from sitemap
│   │
│   ├── endpoints/                    # API Endpoints
│   │   ├── analyze.ts                # Analyze content endpoint
│   │   ├── sitemap.ts                # Sitemap endpoint
│   │   ├── schema.ts                 # Schema endpoint
│   │   └── breadcrumbs.ts            # Breadcrumbs endpoint
│   │
│   ├── translations/                 # i18n
│   │   ├── index.ts
│   │   ├── en.ts
│   │   └── vi.ts
│   │
│   └── exports/                      # Public Exports
│       ├── types.ts
│       ├── fields.ts
│       ├── client.ts
│       └── utilities.ts
│
├── package.json
├── tsconfig.json
├── README.md
└── .swcrc
```

## Kiến Trúc Chi Tiết

### 1. SEO Analysis Engine

#### Scoring Algorithm (0-100)

```typescript
interface SEOScore {
  total: 0-100
  breakdown: {
    keyword: 0-25        // Keyword optimization
    content: 0-25        // Content quality
    technical: 0-25      // Technical SEO
    readability: 0-25    // Readability
  }
  issues: SEOIssue[]
  recommendations: string[]
}
```

#### Các Tiêu Chí Đánh Giá:

**Keyword Optimization (25 điểm)**

- Từ khóa trong title (5 điểm)
- Từ khóa trong description (3 điểm)
- Từ khóa trong heading H1 (4 điểm)
- Từ khóa trong H2-H6 (3 điểm)
- Mật độ từ khóa (1-2%) (5 điểm)
- Từ khóa trong URL (3 điểm)
- Từ khóa trong alt text (2 điểm)

**Content Quality (25 điểm)**

- Độ dài nội dung (>300 từ) (5 điểm)
- Số lượng heading (5 điểm)
- Số lượng hình ảnh có alt text (5 điểm)
- Số lượng links nội bộ (3 điểm)
- Số lượng links ngoại (2 điểm)
- Paragraph length (5 điểm)

**Technical SEO (25 điểm)**

- Meta title tồn tại và độ dài (50-60 ký tự) (7 điểm)
- Meta description tồn tại và độ dài (120-160 ký tự) (7 điểm)
- Schema markup (5 điểm)
- Open Graph tags (3 điểm)
- Canonical URL (3 điểm)

**Readability (25 điểm)**

- Flesch Reading Ease score (10 điểm)
- Độ dài câu trung bình (5 điểm)
- Passive voice usage (5 điểm)
- Transition words (5 điểm)

### 2. Keyword Analysis

```typescript
interface KeywordAnalysis {
  focusKeyword: string
  density: number // 0-100%
  count: number // Số lần xuất hiện

  positions: {
    title: boolean
    description: boolean
    h1: boolean
    h2: number // Số lượng H2 có keyword
    h3: number
    url: boolean
    firstParagraph: boolean
    altTexts: number // Số image có keyword trong alt
  }

  variations: string[] // Long-tail keywords
  related: string[] // Related keywords

  score: number // 0-100
  recommendations: string[]
}
```

### 3. Content Analysis

```typescript
interface ContentAnalysis {
  wordCount: number
  characterCount: number
  paragraphCount: number
  sentenceCount: number

  headings: {
    h1: number
    h2: number
    h3: number
    h4: number
    h5: number
    h6: number
  }

  images: {
    total: number
    withAlt: number
    withoutAlt: number
  }

  links: {
    internal: number
    external: number
    broken: number
  }

  readability: {
    fleschScore: number // 0-100
    fleschKincaid: number // Grade level
    avgWordsPerSentence: number
    avgSyllablesPerWord: number
    passiveVoicePercentage: number
    transitionWords: number
  }

  score: number
  issues: ContentIssue[]
}
```

### 4. Schema Markup Types

Hỗ trợ các loại Schema.org phổ biến:

```typescript
type SchemaType =
  | 'Article'
  | 'NewsArticle'
  | 'BlogPosting'
  | 'Organization'
  | 'Person'
  | 'Product'
  | 'Review'
  | 'BreadcrumbList'
  | 'FAQPage'
  | 'LocalBusiness'
  | 'Event'
  | 'Recipe'
  | 'VideoObject'

interface SchemaMarkup {
  '@context': 'https://schema.org'
  '@type': SchemaType
  [key: string]: any
}
```

### 5. Sitemap Configuration

```typescript
interface SitemapConfig {
  enabled: boolean
  collections: string[]
  excludeCollections?: string[]

  priority: number // 0.0 - 1.0
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

  customEntries?: SitemapEntry[]

  generateImages?: boolean // Include image sitemap
  generateNews?: boolean // Include news sitemap
}

interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: number
  images?: ImageEntry[]
}
```

### 6. Plugin Configuration

```typescript
interface RankMathPluginConfig {
  // Collections/Globals
  collections?: string[]
  globals?: string[]
  uploadsCollection?: string

  // UI Options
  tabbedUI?: boolean
  showScore?: boolean
  showAnalysis?: boolean

  // SEO Analysis
  focusKeywordEnabled?: boolean
  contentAnalysisEnabled?: boolean
  readabilityAnalysisEnabled?: boolean

  // Scoring Weights (custom weight cho từng tiêu chí)
  scoring?: {
    keyword?: number // Default: 25
    content?: number // Default: 25
    technical?: number // Default: 25
    readability?: number // Default: 25
  }

  // Schema Markup
  schemaEnabled?: boolean
  defaultSchemaType?: SchemaType
  organizationSchema?: OrganizationSchema

  // Sitemap
  sitemap?: SitemapConfig

  // Breadcrumbs
  breadcrumbs?: {
    enabled: boolean
    homepageLabel?: string
    structuredData?: boolean
  }

  // Social Media
  openGraph?: {
    enabled: boolean
    defaultImage?: string
    siteName?: string
  }

  twitterCard?: {
    enabled: boolean
    cardType?: 'summary' | 'summary_large_image' | 'app' | 'player'
    site?: string // @username
    creator?: string // @username
  }

  // Auto-generation
  generateTitle?: (args) => string
  generateDescription?: (args) => string
  generateKeywords?: (args) => string[]
  generateSchema?: (args) => SchemaMarkup

  // Custom Fields
  fields?: (args: { defaultFields: Field[] }) => Field[]
}
```

## Data Flow

### 1. Document Edit Flow

```
User edits content
  ↓
Content changes detected (useForm hook)
  ↓
Analyze content (debounced, 500ms)
  ↓
Calculate SEO score
  ↓
Update UI (score gauge, checklist, recommendations)
  ↓
User saves document
  ↓
beforeChange hook: Generate auto fields
  ↓
Save to database
  ↓
afterChange hook: Update sitemap
```

### 2. Analysis Flow

```
Content → Extract text from rich text fields
  ↓
Keyword Analysis → Check positions, density
  ↓
Content Analysis → Count words, headings, links
  ↓
Technical Analysis → Check meta tags, schema
  ↓
Readability Analysis → Calculate Flesch score
  ↓
Combine Scores → Total SEO score (0-100)
  ↓
Generate Recommendations
  ↓
Return to UI
```

## UI Components

### SEO Score Gauge

- Circular progress bar (0-100)
- Color coding:
  - 0-40: Red (Poor)
  - 41-70: Orange (Needs Improvement)
  - 71-85: Yellow (Good)
  - 86-100: Green (Excellent)

### Content Analysis Panel

- Checklist với icons (✓/✗/⚠)
- Real-time updates
- Expandable sections
- Action buttons (fix, ignore)

### Schema Editor

- Visual JSON editor
- Schema type selector
- Property suggestions
- Validation
- Preview

### Social Preview

- Google search result preview
- Facebook preview
- Twitter card preview
- Real-time updates

## API Endpoints

### POST /plugin-seo-rankmath/analyze

Request:

```json
{
  "content": "HTML or markdown content",
  "focusKeyword": "your keyword",
  "meta": {
    "title": "Page title",
    "description": "Meta description"
  }
}
```

Response:

```json
{
  "score": 85,
  "breakdown": {
    "keyword": 22,
    "content": 20,
    "technical": 23,
    "readability": 20
  },
  "keywordAnalysis": {...},
  "contentAnalysis": {...},
  "recommendations": [...]
}
```

### GET /sitemap.xml

- Generate XML sitemap
- Cache for 1 hour
- Support pagination

### GET /plugin-seo-rankmath/schema/:id

- Get schema markup for document
- Support different schema types

## Implementation Phases

### Phase 1: Core Analysis Engine ✓

- Keyword analysis
- Content analysis
- Scoring algorithm
- Readability calculation

### Phase 2: Fields & UI Components

- Focus keyword field
- SEO score display
- Content analysis panel
- Recommendations list

### Phase 3: Schema & Social

- Schema markup generator
- Open Graph fields
- Twitter Card fields
- Social preview

### Phase 4: Sitemap & Breadcrumbs

- XML sitemap generator
- Breadcrumb builder
- Structured data

### Phase 5: Advanced Features

- Link suggestions
- Image SEO analysis
- Internal linking
- Competitor analysis (optional)

## Dependencies

```json
{
  "dependencies": {
    "@payloadcms/translations": "workspace:*",
    "@payloadcms/ui": "workspace:*",
    "fast-xml-parser": "^4.3.0",
    "compromise": "^14.0.0", // NLP for readability
    "syllable": "^5.0.0", // Syllable counter
    "keywords-extractor": "^0.0.25" // Keyword extraction
  },
  "peerDependencies": {
    "payload": "workspace:*",
    "react": "^19.0.0"
  }
}
```

## Testing Strategy

1. **Unit Tests**: Scoring algorithms, analysis functions
2. **Integration Tests**: Plugin integration, hooks, endpoints
3. **E2E Tests**: UI interactions, real-time analysis
4. **Performance Tests**: Large content analysis, sitemap generation

## Next Steps

1. ✓ Create package structure
2. Implement analysis engine
3. Build UI components
4. Add schema support
5. Implement sitemap
6. Write tests
7. Documentation
