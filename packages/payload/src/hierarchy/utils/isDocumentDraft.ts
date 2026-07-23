import type { Document } from '../../types/index.js'

export const isDocumentDraft = ({ doc, locale }: { doc: Document; locale?: string }): boolean => {
  const status = doc._status

  if (typeof status === 'string') {
    return status === 'draft'
  }

  if (!status || typeof status !== 'object' || Array.isArray(status)) {
    return false
  }

  if (!locale || locale === 'all') {
    return false
  }

  return status[locale] === 'draft'
}
