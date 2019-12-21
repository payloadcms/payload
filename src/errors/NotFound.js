import { PayloadError } from './PayloadError';

export class NotFound extends PayloadError {
  constructor() {
    super('Not found.');
  }
}
