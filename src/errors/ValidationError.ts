import httpStatus from 'http-status';
import type { TFunction } from 'i18next';
import APIError from './APIError';

class ValidationError extends APIError<{ message: string; field: string }[]> {
  constructor(results: { message: string; field: string }[], t?: TFunction) {
    const message = t
      ? t('error:followingFieldsInvalid', { count: results.length })
      : `The following field${results.length === 1 ? ' is' : 's are'} invalid:`;
    super(`${message} ${results.map((f) => f.field).join(', ')}`, httpStatus.BAD_REQUEST, results);
  }
}

export default ValidationError;
