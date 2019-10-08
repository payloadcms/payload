import {PayloadError } from './PayloadError';

export class MissingCollectionLabelError extends PayloadError {
  constructor(config) {
    super(`payload.config.collection object is missing label`);
  }
}
