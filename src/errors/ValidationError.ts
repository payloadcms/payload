import httpStatus from 'http-status';
import APIError from './APIError';

class ValidationError extends APIError {
  constructor(results: {message: string, field: string}[]) {
    super(`The following field${results.length === 1 ? ' is' : 's are'} invalid: ${results.map((f) => f.field).join(', ')}`, httpStatus.BAD_REQUEST, results);
  }
}

export default ValidationError;
