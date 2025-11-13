/**
 * Readability analysis using Flesch Reading Ease and other metrics
 */

import {
  countSyllables,
  countTransitionWords,
  extractTextFromHTML,
  isPassiveVoice,
  splitIntoSentences,
} from './utils.js'

export interface ReadabilityAnalysis {
  fleschScore: number // 0-100 (higher is easier)
  fleschKincaid: number // Grade level
  avgWordsPerSentence: number
  avgSyllablesPerWord: number
  complexWords: number // Words with 3+ syllables
  passiveVoicePercentage: number
  transitionWords: number
}

/**
 * Calculate Flesch Reading Ease score
 * Score 90-100: Very Easy (5th grade)
 * Score 80-90: Easy (6th grade)
 * Score 70-80: Fairly Easy (7th grade)
 * Score 60-70: Standard (8th-9th grade)
 * Score 50-60: Fairly Difficult (10th-12th grade)
 * Score 30-50: Difficult (College)
 * Score 0-30: Very Difficult (College graduate)
 *
 * Formula: 206.835 - 1.015(total words/total sentences) - 84.6(total syllables/total words)
 */
export function calculateFleschReadingEase(text: string): number {
  const sentences = splitIntoSentences(text)
  const words = text.split(/\s+/).filter((w) => w.length > 0)

  if (sentences.length === 0 || words.length === 0) {
    return 0
  }

  const totalSentences = sentences.length
  const totalWords = words.length
  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0)

  const avgWordsPerSentence = totalWords / totalSentences
  const avgSyllablesPerWord = totalSyllables / totalWords

  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10))
}

/**
 * Calculate Flesch-Kincaid Grade Level
 * Returns the US grade level (e.g., 8.0 = 8th grade)
 *
 * Formula: 0.39(total words/total sentences) + 11.8(total syllables/total words) - 15.59
 */
export function calculateFleschKincaidGrade(text: string): number {
  const sentences = splitIntoSentences(text)
  const words = text.split(/\s+/).filter((w) => w.length > 0)

  if (sentences.length === 0 || words.length === 0) {
    return 0
  }

  const totalSentences = sentences.length
  const totalWords = words.length
  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0)

  const avgWordsPerSentence = totalWords / totalSentences
  const avgSyllablesPerWord = totalSyllables / totalWords

  const grade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59

  return Math.max(0, Math.round(grade * 10) / 10)
}

/**
 * Analyze readability of content
 */
export function analyzeReadability(content: string): ReadabilityAnalysis {
  const text = extractTextFromHTML(content)
  const sentences = splitIntoSentences(text)
  const words = text.split(/\s+/).filter((w) => w.length > 0)

  if (words.length === 0) {
    return {
      fleschScore: 0,
      fleschKincaid: 0,
      avgWordsPerSentence: 0,
      avgSyllablesPerWord: 0,
      complexWords: 0,
      passiveVoicePercentage: 0,
      transitionWords: 0,
    }
  }

  // Calculate Flesch scores
  const fleschScore = calculateFleschReadingEase(text)
  const fleschKincaid = calculateFleschKincaidGrade(text)

  // Calculate averages
  const avgWordsPerSentence =
    sentences.length > 0 ? Math.round((words.length / sentences.length) * 10) / 10 : 0

  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0)
  const avgSyllablesPerWord = Math.round((totalSyllables / words.length) * 10) / 10

  // Count complex words (3+ syllables)
  const complexWords = words.filter((word) => countSyllables(word) >= 3).length

  // Calculate passive voice percentage
  const passiveSentences = sentences.filter((s) => isPassiveVoice(s)).length
  const passiveVoicePercentage =
    sentences.length > 0 ? Math.round((passiveSentences / sentences.length) * 100) : 0

  // Count transition words
  const transitionWords = countTransitionWords(text)

  return {
    fleschScore,
    fleschKincaid,
    avgWordsPerSentence,
    avgSyllablesPerWord,
    complexWords,
    passiveVoicePercentage,
    transitionWords,
  }
}

/**
 * Get readability level description
 */
export function getReadabilityLevel(score: number): string {
  if (score >= 90) return 'Very Easy'
  if (score >= 80) return 'Easy'
  if (score >= 70) return 'Fairly Easy'
  if (score >= 60) return 'Standard'
  if (score >= 50) return 'Fairly Difficult'
  if (score >= 30) return 'Difficult'
  return 'Very Difficult'
}

/**
 * Get readability recommendations
 */
export function getReadabilityRecommendations(analysis: ReadabilityAnalysis): string[] {
  const recommendations: string[] = []

  // Flesch score recommendations
  if (analysis.fleschScore < 60) {
    recommendations.push(
      `Readability score is ${analysis.fleschScore} (${getReadabilityLevel(analysis.fleschScore)}). Aim for 60+ for better readability.`,
    )
  }

  // Sentence length recommendations
  if (analysis.avgWordsPerSentence > 20) {
    recommendations.push(
      `Average sentence length is ${analysis.avgWordsPerSentence} words. Try to keep it under 20 words.`,
    )
  }

  // Passive voice recommendations
  if (analysis.passiveVoicePercentage > 10) {
    recommendations.push(
      `${analysis.passiveVoicePercentage}% of sentences use passive voice. Try to use active voice more.`,
    )
  }

  // Transition words recommendations
  const transitionPercentage = Math.round(
    (analysis.transitionWords / analysis.avgWordsPerSentence) * 100,
  )
  if (transitionPercentage < 20) {
    recommendations.push('Use more transition words to improve content flow.')
  }

  // Complex words
  if (analysis.complexWords > analysis.avgWordsPerSentence * 5) {
    recommendations.push('Try to use simpler words to improve readability.')
  }

  if (recommendations.length === 0) {
    recommendations.push('Great! Your content is easy to read.')
  }

  return recommendations
}
