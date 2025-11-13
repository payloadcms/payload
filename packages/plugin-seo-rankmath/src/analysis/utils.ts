/**
 * Utility functions for SEO analysis
 */

/**
 * Extract plain text from HTML content
 */
export function extractTextFromHTML(html: string): string {
  if (!html) return ''

  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim()

  return text
}

/**
 * Extract headings from HTML
 */
export function extractHeadings(html: string): {
  h1: string[]
  h2: string[]
  h3: string[]
  h4: string[]
  h5: string[]
  h6: string[]
} {
  const headings = {
    h1: [] as string[],
    h2: [] as string[],
    h3: [] as string[],
    h4: [] as string[],
    h5: [] as string[],
    h6: [] as string[],
  }

  if (!html) return headings

  // Extract each heading level
  for (let i = 1; i <= 6; i++) {
    const regex = new RegExp(`<h${i}[^>]*>(.*?)</h${i}>`, 'gi')
    const matches = html.matchAll(regex)

    for (const match of matches) {
      const text = extractTextFromHTML(match[1])
      headings[`h${i}` as keyof typeof headings].push(text)
    }
  }

  return headings
}

/**
 * Extract links from HTML
 */
export function extractLinks(
  html: string,
  baseUrl?: string,
): {
  internal: string[]
  external: string[]
  nofollow: string[]
} {
  const links = {
    internal: [] as string[],
    external: [] as string[],
    nofollow: [] as string[],
  }

  if (!html) return links

  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi
  const matches = html.matchAll(regex)

  for (const match of matches) {
    const href = match[1]
    const fullTag = match[0]

    // Check for nofollow
    if (fullTag.includes('rel="nofollow"') || fullTag.includes("rel='nofollow'")) {
      links.nofollow.push(href)
    }

    // Determine if internal or external
    if (href.startsWith('/') || href.startsWith('#')) {
      links.internal.push(href)
    } else if (href.startsWith('http')) {
      if (baseUrl && href.startsWith(baseUrl)) {
        links.internal.push(href)
      } else {
        links.external.push(href)
      }
    } else {
      links.internal.push(href)
    }
  }

  return links
}

/**
 * Extract images with alt text
 */
export function extractImages(html: string): {
  total: number
  withAlt: string[]
  withoutAlt: string[]
} {
  const images = {
    total: 0,
    withAlt: [] as string[],
    withoutAlt: [] as string[],
  }

  if (!html) return images

  const regex = /<img[^>]*>/gi
  const matches = html.matchAll(regex)

  for (const match of matches) {
    images.total++
    const imgTag = match[0]

    // Extract alt text
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/)
    if (altMatch && altMatch[1]) {
      images.withAlt.push(altMatch[1])
    } else {
      images.withoutAlt.push(imgTag)
    }
  }

  return images
}

/**
 * Count word occurrences in text (case-insensitive)
 */
export function countOccurrences(text: string, word: string): number {
  if (!text || !word) return 0

  const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi')
  const matches = text.match(regex)
  return matches ? matches.length : 0
}

/**
 * Check if text contains keyword (case-insensitive)
 */
export function containsKeyword(text: string, keyword: string): boolean {
  if (!text || !keyword) return false

  const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i')
  return regex.test(text)
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Split text into sentences
 */
export function splitIntoSentences(text: string): string[] {
  if (!text) return []

  // Simple sentence splitting (can be improved with NLP)
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  return sentences
}

/**
 * Split text into paragraphs
 */
export function splitIntoParagraphs(html: string): string[] {
  if (!html) return []

  // Extract paragraph tags
  const regex = /<p[^>]*>(.*?)<\/p>/gi
  const matches = html.matchAll(regex)

  const paragraphs: string[] = []
  for (const match of matches) {
    const text = extractTextFromHTML(match[1])
    if (text) {
      paragraphs.push(text)
    }
  }

  // If no <p> tags found, split by double line breaks
  if (paragraphs.length === 0) {
    const text = extractTextFromHTML(html)
    return text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
  }

  return paragraphs
}

/**
 * Count syllables in a word (simple estimation)
 */
export function countSyllables(word: string): number {
  if (!word) return 0

  word = word.toLowerCase().trim()
  if (word.length <= 3) return 1

  // Remove silent 'e' at the end
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')

  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]{1,2}/g)
  return vowelGroups ? vowelGroups.length : 1
}

/**
 * Calculate keyword density (percentage)
 */
export function calculateKeywordDensity(text: string, keyword: string): number {
  if (!text || !keyword) return 0

  const words = text.split(/\s+/).filter((w) => w.length > 0)
  const totalWords = words.length

  if (totalWords === 0) return 0

  const keywordCount = countOccurrences(text, keyword)
  return (keywordCount / totalWords) * 100
}

/**
 * Check if sentence is in passive voice (simple heuristic)
 */
export function isPassiveVoice(sentence: string): boolean {
  if (!sentence) return false

  // Simple check for common passive voice patterns
  const passivePatterns = [
    /\b(is|are|was|were|be|been|being)\s+\w+ed\b/i,
    /\b(is|are|was|were|be|been|being)\s+\w+en\b/i,
  ]

  return passivePatterns.some((pattern) => pattern.test(sentence))
}

/**
 * Common transition words
 */
const TRANSITION_WORDS = [
  'therefore',
  'however',
  'moreover',
  'furthermore',
  'nevertheless',
  'consequently',
  'additionally',
  'meanwhile',
  'likewise',
  'similarly',
  'in addition',
  'for example',
  'for instance',
  'in conclusion',
  'as a result',
  'on the other hand',
  'in contrast',
  'in fact',
  'indeed',
  'thus',
  'hence',
]

/**
 * Count transition words in text
 */
export function countTransitionWords(text: string): number {
  if (!text) return 0

  let count = 0
  const lowerText = text.toLowerCase()

  for (const word of TRANSITION_WORDS) {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'g')
    const matches = lowerText.match(regex)
    if (matches) {
      count += matches.length
    }
  }

  return count
}

/**
 * Get first paragraph from HTML
 */
export function getFirstParagraph(html: string): string {
  const paragraphs = splitIntoParagraphs(html)
  return paragraphs.length > 0 ? paragraphs[0] : ''
}

/**
 * Check if keyword is in URL slug
 */
export function isKeywordInURL(url: string, keyword: string): boolean {
  if (!url || !keyword) return false

  const slug = url
    .toLowerCase()
    .replace(/https?:\/\//, '')
    .replace(/www\./, '')
    .replace(/[^a-z0-9-]/g, '-')

  const keywordSlug = keyword.toLowerCase().replace(/\s+/g, '-')

  return slug.includes(keywordSlug)
}
