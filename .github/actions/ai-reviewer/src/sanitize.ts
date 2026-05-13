import type { ReviewComment } from './providers/types'

const MAX_COMMENT_BODY_CHARS = 2000
const MAX_SUMMARY_CHARS = 4000
const MAX_REVIEW_COMMENTS = 20

export function sanitizeMarkdown(text: string, maxLength = MAX_SUMMARY_CHARS): string {
  return text.replace(/@/g, '@​').slice(0, maxLength)
}

export function capComments(comments: ReviewComment[], max = MAX_REVIEW_COMMENTS): ReviewComment[] {
  return comments.slice(0, max)
}

export { MAX_COMMENT_BODY_CHARS, MAX_REVIEW_COMMENTS, MAX_SUMMARY_CHARS }
