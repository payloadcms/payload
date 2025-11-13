/**
 * Default configuration values
 */

export const defaults = {
  // Meta title
  title: {
    minLength: 50,
    maxLength: 60,
  },

  // Meta description
  description: {
    minLength: 120,
    maxLength: 160,
  },

  // Keyword density
  keywordDensity: {
    min: 0.5,
    max: 2.5,
    optimal: 1.5,
  },

  // Content
  content: {
    minWordCount: 300,
    recommendedWordCount: 600,
  },

  // Readability
  readability: {
    targetFleschScore: 60,
    maxSentenceLength: 20,
    maxParagraphSentences: 6,
  },

  // Scoring weights (must total 100)
  scoring: {
    keyword: 25,
    content: 25,
    technical: 25,
    readability: 25,
  },

  // Sitemap
  sitemap: {
    priority: 0.7,
    changefreq: 'weekly' as const,
  },
}
