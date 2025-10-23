import { APIError } from './APIError.js'

export class DuplicateCollection extends APIError {
  constructor(propertyName: string, duplicate: string) {
    super(`Collection ${propertyName} already in use: "${duplicate}"`)
  }
}
