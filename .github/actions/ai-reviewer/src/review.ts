import * as fs from 'fs'
import * as path from 'path'
import type { ReviewResult } from './providers/types'

export function readSystemPrompt(promptFilePath: string): string {
  const absolutePath = path.resolve(process.env.GITHUB_WORKSPACE ?? process.cwd(), promptFilePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Reviewer prompt file not found: ${promptFilePath}`)
  }
  return fs.readFileSync(absolutePath, 'utf-8')
}

export function buildSystemPrompt(promptFilePath: string): string {
  const reviewPrompt = readSystemPrompt(promptFilePath)

  const claudeMdPath = path.resolve(process.env.GITHUB_WORKSPACE ?? process.cwd(), 'CLAUDE.md')
  if (!fs.existsSync(claudeMdPath)) return reviewPrompt

  const claudeMd = fs.readFileSync(claudeMdPath, 'utf-8')
  return `# Project Conventions (from CLAUDE.md)\n\n${claudeMd}\n\n---\n\n# Review Instructions\n\n${reviewPrompt}`
}

export function mergeReviewResults(results: ReviewResult[]): ReviewResult {
  if (results.length === 0) return { summary: '', comments: [] }
  if (results.length === 1) return results[0]

  const summary = results
    .filter((r) => r.summary.trim())
    .map((r) => r.summary.trim())
    .join('\n\n---\n\n')

  const comments = results.flatMap((r) => r.comments)

  return { summary, comments }
}
