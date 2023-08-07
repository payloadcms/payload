import httpStatus from 'http-status';
import type { TFunction } from 'i18next';
import APIError from './APIError';

class AuthenticationError extends APIError {
  constructor(t?: TFunction) {
    super(t ? t('error:emailOrPasswordIncorrect') : 'The email or password provided is incorrect.', httpStatus.UNAUTHORIZED);
  }
}

export default AuthenticationError;
