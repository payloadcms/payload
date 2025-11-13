/**
 * Content quality analysis
 */

import type { ContentAnalysis, ContentIssue } from '../types.js'
import {
  extractHeadings,
  extractImages,
  extractLinks,
  extractTextFromHTML,
  splitIntoParagraphs,
  splitIntoSentences,
} from './utils.js'
import {
  analyzeReadability,
  getReadabilityRecommendations,
  type ReadabilityAnalysis,
} from './readability.js'

export interface ContentAnalysisInput {
  content: string // HTML content
  baseUrl?: string
}

/**
 * Analyze content quality
 */
export function analyzeContent(input: ContentAnalysisInput): ContentAnalysis {
  const { content, baseUrl } = input

  const text = extractTextFromHTML(content)
  const words = text.split(/\s+/).filter((w) => w.length > 0)
  const sentences = splitIntoSentences(text)
  const paragraphs = splitIntoParagraphs(content)

  // Extract structural elements
  const headingsData = extractHeadings(content)
  const imagesData = extractImages(content)
  const linksData = extractLinks(content, baseUrl)

  // Count headings
  const headings = {
    h1: headingsData.h1.length,
    h2: headingsData.h2.length,
    h3: headingsData.h3.length,
    h4: headingsData.h4.length,
    h5: headingsData.h5.length,
    h6: headingsData.h6.length,
  }

  // Count images
  const images = {
    total: imagesData.total,
    withAlt: imagesData.withAlt.length,
    withoutAlt: imagesData.withoutAlt.length,
  }

  // Count links
  const links = {
    internal: linksData.internal.length,
    external: linksData.external.length,
    nofollow: linksData.nofollow.length,
  }

  // Analyze readability
  const readability = analyzeReadability(content)

  // Calculate content score (0-25)
  const contentScore = calculateContentScore({
    wordCount: words.length,
    headings,
    images,
    links,
    paragraphs: paragraphs.length,
  })

  // Calculate readability score (0-25)
  const readabilityScore = calculateReadabilityScore(readability)

  // Total score (content + readability = 0-50, but we normalize to 0-25 for each)
  const score = contentScore + readabilityScore

  // Generate issues
  const issues = generateContentIssues({
    wordCount: words.length,
    headings,
    images,
    links,
    paragraphs,
    readability,
  })

  return {
    wordCount: words.length,
    characterCount: text.length,
    paragraphCount: paragraphs.length,
    sentenceCount: sentences.length,
    headings,
    images,
    links,
    readability,
    score,
    issues,
  }
}

/**
 * Calculate content quality score (0-25)
 */
function calculateContentScore(data: {
  wordCount: number
  headings: ContentAnalysis['headings']
  images: ContentAnalysis['images']
  links: ContentAnalysis['links']
  paragraphs: number
}): number {
  let score = 0

  // Word count (5 points)
  if (data.wordCount >= 300) {
    score += 5
  } else if (data.wordCount >= 150) {
    score += 3
  } else if (data.wordCount >= 100) {
    score += 1
  }

  // Headings (5 points)
  const totalHeadings = Object.values(data.headings).reduce((sum, count) => sum + count, 0)
  if (data.headings.h1 >= 1 && data.headings.h1 <= 3) {
    score += 2
  }
  if (data.headings.h2 >= 2) {
    score += 2
  }
  if (totalHeadings >= 3) {
    score += 1
  }

  // Images with alt text (5 points)
  if (data.images.total > 0) {
    const altPercentage = (data.images.withAlt / data.images.total) * 100
    if (altPercentage === 100) {
      score += 5
    } else if (altPercentage >= 75) {
      score += 3
    } else if (altPercentage >= 50) {
      score += 2
    } else if (altPercentage > 0) {
      score += 1
    }
  } else if (data.wordCount > 300) {
    // Penalize if no images for long content
    score -= 1
  }

  // Internal links (3 points)
  if (data.links.internal >= 3) {
    score += 3
  } else if (data.links.internal >= 1) {
    score += 2
  }

  // External links (2 points)
  if (data.links.external >= 2) {
    score += 2
  } else if (data.links.external >= 1) {
    score += 1
  }

  // Paragraphs (5 points) - good paragraph structure
  if (data.paragraphs >= 3) {
    const wordsPerParagraph = data.wordCount / data.paragraphs
    if (wordsPerParagraph >= 50 && wordsPerParagraph <= 150) {
      score += 5
    } else if (wordsPerParagraph >= 30 && wordsPerParagraph <= 200) {
      score += 3
    } else {
      score += 1
    }
  }

  return Math.max(0, Math.min(score, 25))
}

/**
 * Calculate readability score (0-25)
 */
function calculateReadabilityScore(readability: ReadabilityAnalysis): number {
  let score = 0

  // Flesch Reading Ease (10 points)
  if (readability.fleschScore >= 60) {
    score += 10
  } else if (readability.fleschScore >= 50) {
    score += 7
  } else if (readability.fleschScore >= 40) {
    score += 5
  } else if (readability.fleschScore >= 30) {
    score += 3
  } else if (readability.fleschScore > 0) {
    score += 1
  }

  // Sentence length (5 points)
  if (readability.avgWordsPerSentence <= 20) {
    score += 5
  } else if (readability.avgWordsPerSentence <= 25) {
    score += 3
  } else if (readability.avgWordsPerSentence <= 30) {
    score += 1
  }

  // Passive voice (5 points)
  if (readability.passiveVoicePercentage <= 10) {
    score += 5
  } else if (readability.passiveVoicePercentage <= 20) {
    score += 3
  } else if (readability.passiveVoicePercentage <= 30) {
    score += 1
  }

  // Transition words (5 points)
  if (readability.transitionWords >= 5) {
    score += 5
  } else if (readability.transitionWords >= 3) {
    score += 3
  } else if (readability.transitionWords >= 1) {
    score += 1
  }

  return Math.min(score, 25)
}

/**
 * Generate content issues
 */
function generateContentIssues(data: {
  wordCount: number
  headings: ContentAnalysis['headings']
  images: ContentAnalysis['images']
  links: ContentAnalysis['links']
  paragraphs: any[]
  readability: ReadabilityAnalysis
}): ContentIssue[] {
  const issues: ContentIssue[] = []

  // Word count issues
  if (data.wordCount < 300) {
    issues.push({
      type: 'warning',
      message: `Content is only ${data.wordCount} words. Aim for at least 300 words.`,
      fix: 'Add more detailed information to your content.',
    })
  }

  // Heading issues
  if (data.headings.h1 === 0) {
    issues.push({
      type: 'error',
      message: 'No H1 heading found.',
      fix: 'Add an H1 heading to define the main topic of the page.',
    })
  } else if (data.headings.h1 > 1) {
    issues.push({
      type: 'warning',
      message: `Found ${data.headings.h1} H1 headings. Use only one H1 per page.`,
      fix: 'Convert extra H1 headings to H2 or H3.',
    })
  }

  if (data.headings.h2 === 0) {
    issues.push({
      type: 'warning',
      message: 'No H2 headings found.',
      fix: 'Add H2 headings to structure your content into sections.',
    })
  }

  // Image issues
  if (data.images.withoutAlt > 0) {
    issues.push({
      type: 'warning',
      message: `${data.images.withoutAlt} images are missing alt text.`,
      fix: 'Add descriptive alt text to all images for accessibility and SEO.',
    })
  }

  if (data.images.total === 0 && data.wordCount > 300) {
    issues.push({
      type: 'info',
      message: 'No images found in content.',
      fix: 'Consider adding relevant images to make content more engaging.',
    })
  }

  // Link issues
  if (data.links.internal === 0) {
    issues.push({
      type: 'info',
      message: 'No internal links found.',
      fix: 'Add internal links to related content on your site.',
    })
  }

  if (data.links.external === 0 && data.wordCount > 500) {
    issues.push({
      type: 'info',
      message: 'No external links found.',
      fix: 'Consider adding links to authoritative external sources.',
    })
  }

  // Readability issues
  const readabilityIssues = getReadabilityRecommendations(data.readability)
  readabilityIssues.forEach((message) => {
    issues.push({
      type: 'info',
      message,
    })
  })

  return issues
}
