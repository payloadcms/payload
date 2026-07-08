import type { Document } from '../../../../types/index.js'

export const hasStoredPathChanged = ({
  doc,
  previousDoc,
  slugPathFieldName,
  titlePathFieldName,
}: {
  doc: Document
  previousDoc: Document
  slugPathFieldName: string
  titlePathFieldName: string
}): boolean =>
  JSON.stringify(doc[slugPathFieldName]) !== JSON.stringify(previousDoc?.[slugPathFieldName]) ||
  JSON.stringify(doc[titlePathFieldName]) !== JSON.stringify(previousDoc?.[titlePathFieldName])
