import { PayloadError } from './PayloadError';

export class MissingGlobalLabel extends PayloadError {
  constructor(config) {
    super(`${config.globals} object is missing label`);
  }
}
