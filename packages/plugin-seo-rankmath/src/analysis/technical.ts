/**
 * Technical SEO analysis
 */

import type { SchemaMarkup, TechnicalIssue, TechnicalSEO } from '../types.js'

export interface TechnicalSEOInput {
  meta?: {
    title?: string
    description?: string
    keywords?: string[]
  }
  schema?: SchemaMarkup | null
  openGraph?: Record<string, any>
  canonical?: string
}

/**
 * Analyze technical SEO elements
 */
export function analyzeTechnicalSEO(input: TechnicalSEOInput): TechnicalSEO {
  const { meta, schema, openGraph, canonical } = input

  // Analyze meta tags
  const metaAnalysis = {
    title: {
      exists: !!meta?.title,
      length: meta?.title?.length || 0,
      optimal: false,
    },
    description: {
      exists: !!meta?.description,
      length: meta?.description?.length || 0,
      optimal: false,
    },
    keywords: {
      exists: !!meta?.keywords && meta.keywords.length > 0,
      count: meta?.keywords?.length || 0,
    },
  }

  // Check title optimization (50-60 characters)
  metaAnalysis.title.optimal =
    metaAnalysis.title.exists && metaAnalysis.title.length >= 50 && metaAnalysis.title.length <= 60

  // Check description optimization (120-160 characters)
  metaAnalysis.description.optimal =
    metaAnalysis.description.exists &&
    metaAnalysis.description.length >= 120 &&
    metaAnalysis.description.length <= 160

  // Analyze schema
  const schemaAnalysis = {
    exists: !!schema,
    type: schema?.['@type'] as string | undefined,
    valid: validateSchema(schema),
  }

  // Analyze Open Graph
  const ogAnalysis = {
    exists: !!openGraph && Object.keys(openGraph).length > 0,
    complete: false,
    tags: openGraph ? Object.keys(openGraph) : [],
  }

  // Check if OG tags are complete (title, description, image, url)
  if (openGraph) {
    const requiredTags = ['title', 'description', 'image', 'url']
    ogAnalysis.complete = requiredTags.every((tag) => openGraph[tag])
  }

  // Analyze canonical
  const canonicalAnalysis = {
    exists: !!canonical,
    url: canonical,
  }

  // Calculate score (0-25)
  const score = calculateTechnicalScore({
    meta: metaAnalysis,
    schema: schemaAnalysis,
    openGraph: ogAnalysis,
    canonical: canonicalAnalysis,
  })

  // Generate issues
  const issues = generateTechnicalIssues({
    meta: metaAnalysis,
    schema: schemaAnalysis,
    openGraph: ogAnalysis,
    canonical: canonicalAnalysis,
  })

  return {
    meta: metaAnalysis,
    schema: schemaAnalysis,
    openGraph: ogAnalysis,
    canonical: canonicalAnalysis,
    score,
    issues,
  }
}

/**
 * Calculate technical SEO score (0-25)
 */
function calculateTechnicalScore(data: {
  meta: TechnicalSEO['meta']
  schema: TechnicalSEO['schema']
  openGraph: TechnicalSEO['openGraph']
  canonical: TechnicalSEO['canonical']
}): number {
  let score = 0

  // Meta title (7 points)
  if (data.meta.title.optimal) {
    score += 7
  } else if (data.meta.title.exists) {
    score += 4
  }

  // Meta description (7 points)
  if (data.meta.description.optimal) {
    score += 7
  } else if (data.meta.description.exists) {
    score += 4
  }

  // Schema markup (5 points)
  if (data.schema.exists && data.schema.valid) {
    score += 5
  } else if (data.schema.exists) {
    score += 2
  }

  // Open Graph (3 points)
  if (data.openGraph.complete) {
    score += 3
  } else if (data.openGraph.exists) {
    score += 1
  }

  // Canonical URL (3 points)
  if (data.canonical.exists) {
    score += 3
  }

  return Math.min(score, 25)
}

/**
 * Generate technical SEO issues
 */
function generateTechnicalIssues(data: {
  meta: TechnicalSEO['meta']
  schema: TechnicalSEO['schema']
  openGraph: TechnicalSEO['openGraph']
  canonical: TechnicalSEO['canonical']
}): TechnicalIssue[] {
  const issues: TechnicalIssue[] = []

  // Meta title issues
  if (!data.meta.title.exists) {
    issues.push({
      type: 'error',
      message: 'Meta title is missing',
      fix: 'Add a descriptive meta title (50-60 characters)',
    })
  } else if (data.meta.title.length < 50) {
    issues.push({
      type: 'warning',
      message: `Meta title is too short (${data.meta.title.length} characters)`,
      fix: 'Expand your meta title to 50-60 characters',
    })
  } else if (data.meta.title.length > 60) {
    issues.push({
      type: 'warning',
      message: `Meta title is too long (${data.meta.title.length} characters)`,
      fix: 'Shorten your meta title to 50-60 characters to avoid truncation',
    })
  }

  // Meta description issues
  if (!data.meta.description.exists) {
    issues.push({
      type: 'error',
      message: 'Meta description is missing',
      fix: 'Add a compelling meta description (120-160 characters)',
    })
  } else if (data.meta.description.length < 120) {
    issues.push({
      type: 'warning',
      message: `Meta description is too short (${data.meta.description.length} characters)`,
      fix: 'Expand your meta description to 120-160 characters',
    })
  } else if (data.meta.description.length > 160) {
    issues.push({
      type: 'warning',
      message: `Meta description is too long (${data.meta.description.length} characters)`,
      fix: 'Shorten your meta description to 120-160 characters',
    })
  }

  // Schema markup issues
  if (!data.schema.exists) {
    issues.push({
      type: 'info',
      message: 'No schema markup found',
      fix: 'Add structured data to help search engines understand your content',
    })
  } else if (!data.schema.valid) {
    issues.push({
      type: 'warning',
      message: 'Schema markup is invalid',
      fix: 'Fix your schema markup to ensure it validates',
    })
  }

  // Open Graph issues
  if (!data.openGraph.exists) {
    issues.push({
      type: 'info',
      message: 'No Open Graph tags found',
      fix: 'Add Open Graph tags to improve social media sharing',
    })
  } else if (!data.openGraph.complete) {
    issues.push({
      type: 'warning',
      message: 'Open Graph tags are incomplete',
      fix: 'Add og:title, og:description, og:image, and og:url',
    })
  }

  // Canonical URL issues
  if (!data.canonical.exists) {
    issues.push({
      type: 'info',
      message: 'No canonical URL specified',
      fix: 'Add a canonical URL to avoid duplicate content issues',
    })
  }

  return issues
}

/**
 * Validate schema markup
 */
function validateSchema(schema: SchemaMarkup | null | undefined): boolean {
  if (!schema) return false

  // Check required fields
  if (!schema['@context'] || !schema['@type']) {
    return false
  }

  // Check if @context is correct
  if (schema['@context'] !== 'https://schema.org') {
    return false
  }

  // Basic validation passed
  return true
}
