import httpStatus from 'http-status';
import APIError from './APIError';

class InvalidConfiguration extends APIError {
  constructor(message: string, results?: any) {
    super(message, httpStatus.INTERNAL_SERVER_ERROR, results);
  }
}

export default InvalidConfiguration;
