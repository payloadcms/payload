import { PayloadError } from './PayloadError';

export class DuplicateGlobal extends PayloadError {
  constructor(config) {
    super(`Global label "${config.label}" is already in use`);
  }
}
