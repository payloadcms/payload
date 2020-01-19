import httpStatus from 'http-status';
import APIError from './APIError';

export class NotFound extends APIError {
  constructor() {
    super('Not found.', httpStatus.NOT_FOUND);
  }
}
