import httpStatus from 'http-status';
import type { i18n as Ii18n } from 'i18next';
import APIError from './APIError';

class ValidationError extends APIError {
  constructor(results: {message: string, field: string}[], i18n: Ii18n) {
    super(
      `${i18n.t('error:followingFieldsInvalid', { count: results.length })} ${results.map((f) => f.field).join(', ')}`,
      httpStatus.BAD_REQUEST,
      results,
    );
  }
}

export default ValidationError;
