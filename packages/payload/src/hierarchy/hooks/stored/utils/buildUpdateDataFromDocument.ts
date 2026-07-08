import type { Document } from '../../../../types/index.js'

export const buildUpdateDataFromDocument = ({
  dataFieldNames,
  doc,
}: {
  dataFieldNames: string[]
  doc: Document
}): Record<string, unknown> =>
  dataFieldNames.reduce<Record<string, unknown>>((acc, fieldName) => {
    const value = doc[fieldName]
    if (value !== undefined) {
      acc[fieldName] = value
    }
    return acc
  }, {})
