import { PayloadError } from './PayloadError';

export class ExistingUser extends PayloadError {
  constructor(config) {
    super(`Error when registering ${config.labels.singular}: a user model already exists.`);
  }
}
