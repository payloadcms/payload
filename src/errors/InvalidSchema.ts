import httpStatus from 'http-status';
import APIError from './APIError';

class InvalidSchema extends APIError {
  constructor(message, results) {
    super(message, httpStatus.INTERNAL_SERVER_ERROR, results);
  }
}

export default InvalidSchema;
