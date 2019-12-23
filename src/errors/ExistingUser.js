import { APIError } from './APIError';

export class ExistingUser extends APIError {
  constructor(config) {
    super(`Error when registering "${ config.labels.singular }": a user model already exists.`);
  }
}
