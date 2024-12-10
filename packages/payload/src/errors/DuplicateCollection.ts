import { APIError } from './APIError.js'

export class DuplicateCollection extends APIError {
  constructor(propertyName: string, duplicates: string[]) {
    super(`Collection ${propertyName} already in use: "${duplicates.join(', ')}"`)
  }
}
