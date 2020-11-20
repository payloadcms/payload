import httpStatus from 'http-status';
import APIError from './APIError';

class Forbidden extends APIError {
  constructor() {
    super('You are not allowed to perform this action.', httpStatus.FORBIDDEN);
  }
}

export default Forbidden;
