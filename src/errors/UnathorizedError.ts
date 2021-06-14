import httpStatus from 'http-status';
import APIError from './APIError';

class UnauthorizedError extends APIError {
  constructor() {
    super('Unauthorized, you must be logged in to make this request.', httpStatus.UNAUTHORIZED);
  }
}

export default UnauthorizedError;
