import APIError from './APIError'

class MissingCollectionLabel extends APIError {
  constructor() {
    super('payload.config.collection object is missing label')
  }
}

export default MissingCollectionLabel
