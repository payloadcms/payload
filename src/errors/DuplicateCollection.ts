import APIError from './APIError';

class DuplicateCollection extends APIError {
  constructor(propertyName, duplicates) {
    super(`Collection ${propertyName} already in use: "${duplicates.join(', ')}"`);
  }
}

export default DuplicateCollection;
