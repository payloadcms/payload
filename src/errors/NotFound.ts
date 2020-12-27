import httpStatus from 'http-status';
import APIError from './APIError';

class NotFound extends APIError {
  constructor() {
    super('The requested resource was not found.', httpStatus.NOT_FOUND);
  }
}

export default NotFound;
