import APIError from './APIError'

class DuplicateCollection extends APIError {
  constructor(propertyName: string, duplicates: string[]) {
    super(`Collection ${propertyName} already in use: "${duplicates.join(', ')}"`)
  }
}

export default DuplicateCollection
