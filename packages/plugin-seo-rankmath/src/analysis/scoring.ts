/**
 * SEO Scoring Engine - Combines all analysis into final score
 */

import type {
  ContentAnalysis,
  KeywordAnalysis,
  SEOIssue,
  SEOScore,
  TechnicalSEO,
} from '../types.js'

export interface ScoringWeights {
  keyword: number // Default: 25
  content: number // Default: 25
  technical: number // Default: 25
  readability: number // Default: 25
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  keyword: 25,
  content: 15,
  technical: 25,
  readability: 10,
}

/**
 * Calculate overall SEO score from all analyses
 */
export function calculateSEOScore(
  keyword: KeywordAnalysis,
  content: ContentAnalysis,
  technical: TechnicalSEO,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): SEOScore {
  // Normalize scores to match weights
  const keywordScore = normalizeScore(keyword.score, 25, weights.keyword)

  // Content analysis returns 0-50 (content + readability)
  // We need to split it based on weights
  const totalContentWeight = weights.content + weights.readability
  const contentScore = normalizeScore(content.score, 50, totalContentWeight)

  const technicalScore = normalizeScore(technical.score, 25, weights.technical)

  // Calculate breakdown
  const breakdown = {
    keyword: Math.round(keywordScore),
    content: Math.round(contentScore * (weights.content / totalContentWeight)),
    technical: Math.round(technicalScore),
    readability: Math.round(contentScore * (weights.readability / totalContentWeight)),
  }

  // Total score
  const total = Math.round(
    breakdown.keyword + breakdown.content + breakdown.technical + breakdown.readability,
  )

  // Collect all issues
  const issues: SEOIssue[] = []

  // Keyword issues
  if (keyword.score < 15) {
    issues.push({
      type: 'error',
      category: 'keyword',
      message: 'Keyword optimization needs improvement',
      priority: 9,
    })
  } else if (keyword.score < 20) {
    issues.push({
      type: 'warning',
      category: 'keyword',
      message: 'Keyword optimization could be better',
      priority: 6,
    })
  }

  // Content issues from content analysis
  content.issues.forEach((issue) => {
    issues.push({
      type: issue.type,
      category: 'content',
      message: issue.message,
      fix: issue.fix,
      priority: issue.type === 'error' ? 8 : issue.type === 'warning' ? 5 : 3,
    })
  })

  // Technical issues
  technical.issues.forEach((issue) => {
    issues.push({
      type: issue.type,
      category: 'technical',
      message: issue.message,
      fix: issue.fix,
      priority: issue.type === 'error' ? 10 : issue.type === 'warning' ? 7 : 4,
    })
  })

  // Readability issues
  if (content.readability.fleschScore < 50) {
    issues.push({
      type: 'warning',
      category: 'readability',
      message: 'Content readability is difficult',
      fix: 'Use shorter sentences and simpler words',
      priority: 5,
    })
  }

  // Sort issues by priority (highest first)
  issues.sort((a, b) => b.priority - a.priority)

  // Generate recommendations
  const recommendations = generateRecommendations(breakdown, issues)

  return {
    total,
    breakdown,
    issues,
    recommendations,
  }
}

/**
 * Normalize score from one range to another
 */
function normalizeScore(score: number, maxScore: number, targetMax: number): number {
  return (score / maxScore) * targetMax
}

/**
 * Generate overall recommendations based on score
 */
function generateRecommendations(breakdown: SEOScore['breakdown'], issues: SEOIssue[]): string[] {
  const recommendations: string[] = []

  // Priority recommendations based on lowest scores
  const scores = [
    { category: 'keyword', score: breakdown.keyword, max: 25 },
    { category: 'content', score: breakdown.content, max: 25 },
    { category: 'technical', score: breakdown.technical, max: 25 },
    { category: 'readability', score: breakdown.readability, max: 25 },
  ]

  // Sort by score percentage (ascending)
  scores.sort((a, b) => a.score / a.max - b.score / b.max)

  // Add recommendations for lowest scoring categories
  scores.slice(0, 2).forEach((item) => {
    const percentage = (item.score / item.max) * 100

    if (percentage < 50) {
      recommendations.push(
        `Focus on improving ${item.category} optimization (currently ${Math.round(percentage)}%)`,
      )
    }
  })

  // Add specific recommendations from high-priority issues
  const highPriorityIssues = issues.filter((issue) => issue.priority >= 8).slice(0, 3)

  highPriorityIssues.forEach((issue) => {
    if (issue.fix) {
      recommendations.push(issue.fix)
    }
  })

  // General recommendations based on total score
  const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0)

  if (totalScore >= 85) {
    recommendations.push('Excellent! Your SEO is optimized. Keep maintaining this quality.')
  } else if (totalScore >= 70) {
    recommendations.push('Good SEO! Make a few improvements to reach excellent.')
  } else if (totalScore >= 50) {
    recommendations.push('Fair SEO. Focus on the areas highlighted above.')
  } else {
    recommendations.push('SEO needs significant improvement. Start with high-priority issues.')
  }

  return recommendations
}

/**
 * Get SEO score level
 */
export function getSEOScoreLevel(score: number): {
  level: string
  color: string
  description: string
} {
  if (score >= 86) {
    return {
      level: 'Excellent',
      color: 'green',
      description: 'Your content is highly optimized for search engines',
    }
  } else if (score >= 71) {
    return {
      level: 'Good',
      color: 'yellow',
      description: 'Your content is well optimized with room for improvement',
    }
  } else if (score >= 41) {
    return {
      level: 'Needs Improvement',
      color: 'orange',
      description: 'Your content needs optimization for better search rankings',
    }
  } else {
    return {
      level: 'Poor',
      color: 'red',
      description: 'Your content needs significant SEO improvements',
    }
  }
}
