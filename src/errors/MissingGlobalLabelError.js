import {PayloadError } from './PayloadError';

export class MissingGlobalLabelError extends PayloadError {
  constructor(config) {
    super(`payload.config.globals object is missing label`);
  }
}
