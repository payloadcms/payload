import httpStatus from 'http-status';
import APIError from './APIError';

class LockedAuth extends APIError {
  constructor() {
    super('This user is locked due to having too many failed login attempts.', httpStatus.UNAUTHORIZED);
  }
}

export default LockedAuth;
