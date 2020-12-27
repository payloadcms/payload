import httpStatus from 'http-status';
import APIError from './APIError';

class ValidationError extends APIError {
  constructor(results: {message: string, field: string}[]) {
    super(`Bad request with ${results.length} errors`, httpStatus.BAD_REQUEST, results);
  }
}

export default ValidationError;
