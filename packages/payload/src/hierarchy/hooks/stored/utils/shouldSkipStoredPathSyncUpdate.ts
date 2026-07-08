import type { Document } from '../../../../types/index.js'

export const shouldSkipStoredPathSyncUpdate = ({
  currentDoc,
  nextSlugPath,
  nextTitlePath,
  slugPathFieldName,
  titlePathFieldName,
}: {
  currentDoc: Document
  nextSlugPath: Record<string, string> | string
  nextTitlePath: Record<string, string> | string
  slugPathFieldName: string
  titlePathFieldName: string
}): boolean =>
  JSON.stringify(currentDoc[slugPathFieldName]) === JSON.stringify(nextSlugPath) &&
  JSON.stringify(currentDoc[titlePathFieldName]) === JSON.stringify(nextTitlePath)
