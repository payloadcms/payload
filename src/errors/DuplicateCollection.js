import APIError from './APIError';

export class DuplicateCollection extends APIError {
  constructor(config) {
    super(`Collection name "${config.labels.singular}" is already in use`);
  }
}
