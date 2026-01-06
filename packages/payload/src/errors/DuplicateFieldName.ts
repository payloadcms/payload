import { APIError } from './APIError.js'

export class DuplicateFieldName extends APIError {
  constructor(fieldName: string, collectionName?: string, blockFieldName?: string) {
    const collectionString = collectionName ? ` in collection '${collectionName}'` : ''
    const blockFieldString = blockFieldName ? ` in field '${blockFieldName}'` : ''
    const contextString = collectionString + blockFieldString
    super(
      `A field with the name '${fieldName}' was found multiple times on the same level${contextString}. Field names must be unique.`,
    )
  }
}
