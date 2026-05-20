import type { ReviewComment } from './providers/types'

const MAX_COMMENT_BODY_CHARS = 2000
const MAX_SUMMARY_CHARS = 4000
const MAX_REVIEW_COMMENTS = 20

function normalizeMarkdownLinks(text: string): string {
  // The URL pattern alternates between non-paren chars and balanced inner groups,
  // so javascript:void(0) is captured whole instead of stopping at the inner ).
  return text.replace(/\[([^\]]*)\]\(((?:[^()]+|\([^)]*\))*)\)/g, (_, displayText, url) => {
    if (/^https?:\/\//i.test(url)) {
      return `[${url}](${url})`
    }
    if (url.startsWith('#') || url.startsWith('/') || url.startsWith('.')) {
      return `[${displayText}](${url})`
    }
    return displayText
  })
}

export function sanitizeMarkdown(text: string, maxLength = MAX_SUMMARY_CHARS): string {
  return normalizeMarkdownLinks(text).replace(/@/g, '@​').slice(0, maxLength)
}

export function capComments(comments: ReviewComment[], max = MAX_REVIEW_COMMENTS): ReviewComment[] {
  return comments.slice(0, max)
}

export function filterCommentsToChangedFiles(
  comments: ReviewComment[],
  changedPaths: Set<string>,
): ReviewComment[] {
  return comments.filter((c) => changedPaths.has(c.path))
}

export { MAX_COMMENT_BODY_CHARS, MAX_REVIEW_COMMENTS, MAX_SUMMARY_CHARS }
