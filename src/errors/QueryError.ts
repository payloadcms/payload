import httpStatus from 'http-status';
import type { TFunction } from 'i18next';
import APIError from './APIError';

class QueryError extends APIError {
  constructor(results: { path: string }[], t?: TFunction) {
    const message = t ? t('error:unspecific', { count: results.length }) : `The following path${results.length === 1 ? '' : 's'} cannot be queried:`;
    super(
      `${message} ${results.map((err) => err.path).join(', ')}`,
      httpStatus.BAD_REQUEST,
      results,
    );
  }
}

export default QueryError;
