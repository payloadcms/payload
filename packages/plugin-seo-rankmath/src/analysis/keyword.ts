/**
 * Keyword optimization analysis
 */

import type { KeywordAnalysis } from '../types.js'
import {
  calculateKeywordDensity,
  containsKeyword,
  countOccurrences,
  extractHeadings,
  extractImages,
  extractTextFromHTML,
  getFirstParagraph,
  isKeywordInURL,
} from './utils.js'

export interface KeywordAnalysisInput {
  content: string // HTML content
  focusKeyword: string
  meta?: {
    title?: string
    description?: string
  }
  url?: string
}

/**
 * Analyze keyword optimization
 */
export function analyzeKeyword(input: KeywordAnalysisInput): KeywordAnalysis {
  const { content, focusKeyword, meta, url } = input

  if (!focusKeyword) {
    return createEmptyAnalysis()
  }

  const text = extractTextFromHTML(content)
  const headings = extractHeadings(content)
  const images = extractImages(content)

  // Count occurrences
  const count = countOccurrences(text, focusKeyword)
  const density = calculateKeywordDensity(text, focusKeyword)

  // Check positions
  const positions = {
    title: meta?.title ? containsKeyword(meta.title, focusKeyword) : false,
    description: meta?.description ? containsKeyword(meta.description, focusKeyword) : false,
    h1: headings.h1.some((h) => containsKeyword(h, focusKeyword)),
    h2: headings.h2.filter((h) => containsKeyword(h, focusKeyword)).length,
    h3: headings.h3.filter((h) => containsKeyword(h, focusKeyword)).length,
    h4: headings.h4.filter((h) => containsKeyword(h, focusKeyword)).length,
    url: url ? isKeywordInURL(url, focusKeyword) : false,
    firstParagraph: containsKeyword(getFirstParagraph(content), focusKeyword),
    altTexts: images.withAlt.filter((alt) => containsKeyword(alt, focusKeyword)).length,
  }

  // Calculate score (0-25)
  const score = calculateKeywordScore(positions, density, count)

  // Generate recommendations
  const recommendations = generateKeywordRecommendations(positions, density, count)

  // Generate keyword variations (simple implementation)
  const variations = generateKeywordVariations(focusKeyword)
  const related = generateRelatedKeywords(focusKeyword)

  return {
    focusKeyword,
    density,
    count,
    positions,
    variations,
    related,
    score,
    recommendations,
  }
}

/**
 * Calculate keyword optimization score (0-25)
 */
function calculateKeywordScore(
  positions: KeywordAnalysis['positions'],
  density: number,
  count: number,
): number {
  let score = 0

  // Title (5 points)
  if (positions.title) score += 5

  // Description (3 points)
  if (positions.description) score += 3

  // H1 (4 points)
  if (positions.h1) score += 4

  // H2-H4 (3 points total)
  const headingScore = Math.min(positions.h2 + positions.h3 + positions.h4, 3)
  score += headingScore

  // Keyword density (5 points - optimal 0.5-2.5%)
  if (density >= 0.5 && density <= 2.5) {
    score += 5
  } else if (density >= 0.3 && density <= 3.0) {
    score += 3
  } else if (density > 0 && density < 0.3) {
    score += 1
  }

  // URL (3 points)
  if (positions.url) score += 3

  // Alt text (2 points)
  if (positions.altTexts > 0) {
    score += Math.min(positions.altTexts, 2)
  }

  return Math.min(score, 25)
}

/**
 * Generate keyword recommendations
 */
function generateKeywordRecommendations(
  positions: KeywordAnalysis['positions'],
  density: number,
  count: number,
): string[] {
  const recommendations: string[] = []

  if (!positions.title) {
    recommendations.push('Add your focus keyword to the page title')
  }

  if (!positions.description) {
    recommendations.push('Include your focus keyword in the meta description')
  }

  if (!positions.h1) {
    recommendations.push('Use your focus keyword in at least one H1 heading')
  }

  if (positions.h2 === 0) {
    recommendations.push('Add your focus keyword to at least one H2 heading')
  }

  if (!positions.firstParagraph) {
    recommendations.push('Include your focus keyword in the first paragraph')
  }

  if (!positions.url) {
    recommendations.push('Consider adding your focus keyword to the URL slug')
  }

  if (positions.altTexts === 0) {
    recommendations.push('Add your focus keyword to image alt texts')
  }

  if (density < 0.5) {
    recommendations.push(
      `Keyword density is too low (${density.toFixed(2)}%). Aim for 0.5-2.5% to improve SEO.`,
    )
  } else if (density > 2.5) {
    recommendations.push(
      `Keyword density is too high (${density.toFixed(2)}%). Reduce to 0.5-2.5% to avoid keyword stuffing.`,
    )
  }

  if (count === 0) {
    recommendations.push('Your focus keyword does not appear in the content')
  } else if (count === 1) {
    recommendations.push('Use your focus keyword more times in the content')
  }

  if (recommendations.length === 0) {
    recommendations.push('Great! Your keyword optimization is on point.')
  }

  return recommendations
}

/**
 * Generate keyword variations (simple implementation)
 */
function generateKeywordVariations(keyword: string): string[] {
  const variations: string[] = []

  // Add plural form
  if (!keyword.endsWith('s')) {
    variations.push(`${keyword}s`)
  }

  // Add common variations
  const words = keyword.split(' ')
  if (words.length > 1) {
    // Reverse word order for 2-word keywords
    if (words.length === 2) {
      variations.push(words.reverse().join(' '))
    }

    // Add quoted version
    variations.push(`"${keyword}"`)
  }

  // Add "how to" version
  variations.push(`how to ${keyword}`)

  // Add "best" version
  variations.push(`best ${keyword}`)

  return variations
}

/**
 * Generate related keywords (simple implementation)
 */
function generateRelatedKeywords(keyword: string): string[] {
  const related: string[] = []

  // Add common related terms
  const prefixes = ['top', 'best', 'free', 'online', 'cheap', 'affordable']
  const suffixes = ['guide', 'tips', 'tutorial', 'review', 'comparison']

  // Add prefix variations
  prefixes.forEach((prefix) => {
    related.push(`${prefix} ${keyword}`)
  })

  // Add suffix variations
  suffixes.forEach((suffix) => {
    related.push(`${keyword} ${suffix}`)
  })

  return related.slice(0, 10) // Return top 10
}

/**
 * Create empty analysis
 */
function createEmptyAnalysis(): KeywordAnalysis {
  return {
    focusKeyword: '',
    density: 0,
    count: 0,
    positions: {
      title: false,
      description: false,
      h1: false,
      h2: 0,
      h3: 0,
      h4: 0,
      url: false,
      firstParagraph: false,
      altTexts: 0,
    },
    variations: [],
    related: [],
    score: 0,
    recommendations: ['Please enter a focus keyword to analyze'],
  }
}
