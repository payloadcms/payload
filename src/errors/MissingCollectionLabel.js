import { PayloadError } from './PayloadError';

export class MissingCollectionLabel extends PayloadError {
  constructor(config) {
    super('payload.config.collection object is missing label');
  }
}
