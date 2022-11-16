import httpStatus from 'http-status';
import type { i18n as Ii18n } from 'i18next';
import APIError from './APIError';

class AuthenticationError extends APIError {
  constructor(i18n?: Ii18n) {
    super(i18n?.t('error:emailOrPasswordIncorrect' || 'The email or password provided is incorrect.'), httpStatus.UNAUTHORIZED);
  }
}

export default AuthenticationError;
