import { APIError } from './APIError.js'

export class MissingCollectionLabel extends APIError {
  constructor() {
    super('payload.config.collection object is missing label')
  }
}
