/**
 * Main SEO Analysis Engine
 * Combines keyword, content, technical, and readability analysis
 */

import type { AnalyzeContentRequest, SEOAnalysisResult } from '../types.js'
import { analyzeContent } from './content.js'
import { analyzeKeyword } from './keyword.js'
import { calculateSEOScore, DEFAULT_WEIGHTS, type ScoringWeights } from './scoring.js'
import { analyzeTechnicalSEO } from './technical.js'

export * from './content.js'
export * from './keyword.js'
export * from './readability.js'
export * from './scoring.js'
export * from './technical.js'
export * from './utils.js'

/**
 * Perform complete SEO analysis
 */
export function analyzeSEO(
  request: AnalyzeContentRequest,
  weights?: ScoringWeights,
): SEOAnalysisResult {
  // Analyze keyword optimization
  const keywordAnalysis = analyzeKeyword({
    content: request.content,
    focusKeyword: request.focusKeyword || '',
    meta: request.meta,
    url: request.url,
  })

  // Analyze content quality and readability
  const contentAnalysis = analyzeContent({
    content: request.content,
    baseUrl: request.url ? new URL(request.url).origin : undefined,
  })

  // Analyze technical SEO
  const technicalAnalysis = analyzeTechnicalSEO({
    meta: request.meta,
    schema: request.schema,
    openGraph: request.openGraph,
    canonical: request.url,
  })

  // Calculate overall score
  const score = calculateSEOScore(
    keywordAnalysis,
    contentAnalysis,
    technicalAnalysis,
    weights || DEFAULT_WEIGHTS,
  )

  return {
    score,
    keyword: keywordAnalysis,
    content: contentAnalysis,
    technical: technicalAnalysis,
    timestamp: new Date().toISOString(),
  }
}
