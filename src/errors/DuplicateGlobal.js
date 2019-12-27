import { APIError } from './APIError';

export class DuplicateGlobal extends APIError {
  constructor(config) {
    super(`Global label "${config.label}" is already in use`);
  }
}
