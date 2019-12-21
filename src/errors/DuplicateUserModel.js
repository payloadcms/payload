import { PayloadError } from './PayloadError';

export class DuplicateUserModel extends PayloadError {
  constructor(config) {
    super(`Error when registering ${config.labels.singular}: a user model already exists.`);
  }
}
