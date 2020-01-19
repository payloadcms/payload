import APIError from './APIError';

export class MissingCollectionLabel extends APIError {
  constructor(config) {
    super('payload.config.collection object is missing label');
  }
}
