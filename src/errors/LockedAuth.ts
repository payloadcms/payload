import httpStatus from 'http-status';
import type { i18n as Ii18n } from 'i18next';
import APIError from './APIError';

class LockedAuth extends APIError {
  constructor(i18n?: Ii18n) {
    super(i18n?.t('error:userLocked') || 'This user is locked due to having too many failed login attempts.', httpStatus.UNAUTHORIZED);
  }
}

export default LockedAuth;
