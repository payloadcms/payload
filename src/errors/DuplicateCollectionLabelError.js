import {PayloadError } from './PayloadError';

export class DuplicateCollectionLabelError extends PayloadError {
  constructor(config) {
    super(`Collection name "${config.labels.singular}" is already in use`);
  }
}
