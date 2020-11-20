import httpStatus from 'http-status';
import APIError from './APIError';

class ValidationError extends APIError {
  constructor(results) {
    super(`Bad request with ${results.length} errors`, httpStatus.BAD_REQUEST, results);
  }
}

export default ValidationError;
