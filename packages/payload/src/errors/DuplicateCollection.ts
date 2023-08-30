import APIError from './APIError.js'

class DuplicateCollection extends APIError {
  constructor(propertyName: string, duplicates: string[]) {
    super(`Collection ${propertyName} already in use: "${duplicates.join(', ')}"`)
  }
}

export default DuplicateCollection
