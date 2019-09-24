import {PayloadError } from './PayloadError';

export class DuplicateModelNameError extends PayloadError {
  constructor(config) {
    super(`Model name "${config.labels.singular}" is already in use`);
  }
}
