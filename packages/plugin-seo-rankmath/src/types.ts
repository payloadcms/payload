import type {
  CollectionConfig,
  CollectionSlug,
  Field,
  GlobalConfig,
  GlobalSlug,
  PayloadRequest,
  UploadCollectionSlug,
} from 'payload'

// ============================================================================
// SEO Analysis Types
// ============================================================================

export interface SEOScore {
  total: number // 0-100
  breakdown: {
    keyword: number // 0-25
    content: number // 0-25
    technical: number // 0-25
    readability: number // 0-25
  }
  issues: SEOIssue[]
  recommendations: string[]
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  category: 'keyword' | 'content' | 'technical' | 'readability'
  message: string
  fix?: string
  priority: number // 1-10
}

// ============================================================================
// Keyword Analysis
// ============================================================================

export interface KeywordAnalysis {
  focusKeyword: string
  density: number // 0-100%
  count: number // Number of occurrences

  positions: {
    title: boolean
    description: boolean
    h1: boolean
    h2: number // Number of H2s with keyword
    h3: number
    h4: number
    url: boolean
    firstParagraph: boolean
    altTexts: number // Number of images with keyword in alt
  }

  variations: string[] // Long-tail keywords
  related: string[] // Related keywords

  score: number // 0-25
  recommendations: string[]
}

// ============================================================================
// Content Analysis
// ============================================================================

export interface ContentAnalysis {
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
    nofollow: number
  }

  readability: {
    fleschScore: number // 0-100
    fleschKincaid: number // Grade level
    avgWordsPerSentence: number
    avgSyllablesPerWord: number
    complexWords: number
    passiveVoicePercentage: number
    transitionWords: number
  }

  score: number // 0-50 (content + readability)
  issues: ContentIssue[]
}

export interface ContentIssue {
  type: 'error' | 'warning' | 'info'
  message: string
  fix?: string
}

// ============================================================================
// Technical SEO
// ============================================================================

export interface TechnicalSEO {
  meta: {
    title: {
      exists: boolean
      length: number
      optimal: boolean // 50-60 characters
    }
    description: {
      exists: boolean
      length: number
      optimal: boolean // 120-160 characters
    }
    keywords: {
      exists: boolean
      count: number
    }
  }

  schema: {
    exists: boolean
    type?: string
    valid: boolean
  }

  openGraph: {
    exists: boolean
    complete: boolean
    tags: string[]
  }

  canonical: {
    exists: boolean
    url?: string
  }

  score: number // 0-25
  issues: TechnicalIssue[]
}

export interface TechnicalIssue {
  type: 'error' | 'warning' | 'info'
  message: string
  fix?: string
}

// ============================================================================
// Complete Analysis Result
// ============================================================================

export interface SEOAnalysisResult {
  score: SEOScore
  keyword: KeywordAnalysis
  content: ContentAnalysis
  technical: TechnicalSEO
  timestamp: string
}

// ============================================================================
// Schema Types
// ============================================================================

export type SchemaType =
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
  | 'WebPage'
  | 'WebSite'

export interface SchemaMarkup {
  '@context': 'https://schema.org'
  '@type': SchemaType | SchemaType[]
  [key: string]: any
}

export interface OrganizationSchema {
  name: string
  url: string
  logo?: string
  description?: string
  sameAs?: string[] // Social media profiles
  contactPoint?: {
    '@type': 'ContactPoint'
    telephone: string
    contactType: string
  }
}

// ============================================================================
// Sitemap Types
// ============================================================================

export interface SitemapConfig {
  enabled: boolean
  collections: string[]
  excludeCollections?: string[]

  priority: number // 0.0 - 1.0
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

  customEntries?: SitemapEntry[]

  generateImages?: boolean
  generateNews?: boolean

  cache?: {
    enabled: boolean
    duration: number // seconds
  }
}

export interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
  images?: ImageEntry[]
}

export interface ImageEntry {
  loc: string
  caption?: string
  title?: string
  license?: string
}

// ============================================================================
// Breadcrumb Types
// ============================================================================

export interface BreadcrumbConfig {
  enabled: boolean
  homepageLabel?: string
  structuredData?: boolean
  separator?: string
}

export interface BreadcrumbItem {
  label: string
  url: string
}

// ============================================================================
// Plugin Configuration
// ============================================================================

export interface RankMathPluginConfig {
  // Collections/Globals
  collections?: CollectionSlug[]
  globals?: GlobalSlug[]
  uploadsCollection?: UploadCollectionSlug

  // UI Options
  tabbedUI?: boolean
  showScore?: boolean
  showAnalysis?: boolean
  realTimeAnalysis?: boolean

  // SEO Analysis Features
  focusKeywordEnabled?: boolean
  contentAnalysisEnabled?: boolean
  readabilityAnalysisEnabled?: boolean
  keywordSuggestionsEnabled?: boolean

  // Scoring Weights (must add up to 100)
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
  autoGenerateSchema?: boolean

  // Sitemap
  sitemap?: SitemapConfig

  // Breadcrumbs
  breadcrumbs?: BreadcrumbConfig

  // Social Media
  openGraph?: {
    enabled: boolean
    defaultImage?: string
    siteName?: string
    siteUrl?: string
  }

  twitterCard?: {
    enabled: boolean
    cardType?: 'summary' | 'summary_large_image' | 'app' | 'player'
    site?: string // @username
    creator?: string // @username
  }

  // Auto-generation Functions
  generateTitle?: GenerateTitle
  generateDescription?: GenerateDescription
  generateKeywords?: GenerateKeywords
  generateSchema?: GenerateSchema
  generateURL?: GenerateURL

  // Content Analysis Settings
  readability?: {
    targetScore?: number // Flesch Reading Ease target (default: 60-70)
    maxSentenceLength?: number // Max words per sentence (default: 20)
    maxParagraphLength?: number // Max sentences per paragraph (default: 6)
  }

  // Keyword Settings
  keywordDensity?: {
    min?: number // Min density percentage (default: 0.5)
    max?: number // Max density percentage (default: 2.5)
    optimal?: number // Optimal density (default: 1.5)
  }

  // Custom Fields
  fields?: FieldsOverride

  // Interface name for TypeScript
  interfaceName?: string
}

// ============================================================================
// Field & Generate Function Types
// ============================================================================

export type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]

export interface GenerateContext {
  collectionConfig?: CollectionConfig
  globalConfig?: GlobalConfig
  doc: any
  locale?: string
  req: PayloadRequest
  collectionSlug?: CollectionSlug
  globalSlug?: GlobalSlug
}

export type GenerateTitle = (args: GenerateContext) => Promise<string> | string

export type GenerateDescription = (args: GenerateContext) => Promise<string> | string

export type GenerateKeywords = (args: GenerateContext) => Promise<string[]> | string[]

export type GenerateSchema = (args: GenerateContext) => Promise<SchemaMarkup> | SchemaMarkup

export type GenerateURL = (args: GenerateContext) => Promise<string> | string

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface AnalyzeContentRequest {
  content: string
  focusKeyword?: string
  meta?: {
    title?: string
    description?: string
    keywords?: string[]
  }
  url?: string
  schema?: SchemaMarkup
  openGraph?: Record<string, any>
}

export interface AnalyzeContentResponse {
  success: boolean
  analysis: SEOAnalysisResult
}

// ============================================================================
// UI Component Props
// ============================================================================

export interface SEOScoreGaugeProps {
  score: number
  breakdown?: SEOScore['breakdown']
  size?: 'small' | 'medium' | 'large'
}

export interface ContentAnalysisProps {
  analysis: ContentAnalysis
  focusKeyword?: string
}

export interface KeywordAnalysisProps {
  analysis: KeywordAnalysis
}

export interface SEOChecklistProps {
  issues: SEOIssue[]
  onFix?: (issue: SEOIssue) => void
}

// ============================================================================
// Field Component Props
// ============================================================================

export interface FocusKeywordFieldProps {
  hasAnalysis?: boolean
}

export interface SEOScoreFieldProps {
  realTime?: boolean
}

export interface SchemaMarkupFieldProps {
  schemaTypes?: SchemaType[]
  defaultType?: SchemaType
}
