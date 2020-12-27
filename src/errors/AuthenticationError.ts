import httpStatus from 'http-status';
import APIError from './APIError';

class AuthenticationError extends APIError {
  constructor() {
    super('The email or password provided is incorrect.', httpStatus.UNAUTHORIZED);
  }
}

export default AuthenticationError;
