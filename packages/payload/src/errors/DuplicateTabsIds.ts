import { APIError } from './APIError.js'

export class DuplicateTabsIds extends APIError {
  constructor(duplicates: string[]) {
    super(`Collection tabs ids already in use: "${duplicates.join(', ')}"`)
  }
}
