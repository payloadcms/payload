/* eslint-disable max-classes-per-file */
import httpStatus from 'http-status';

class ExtendableError<TData extends object = { [key: string]: unknown }> extends Error {
  status: number;

  data: TData;

  isPublic: boolean;

  isOperational: boolean;

  constructor(message: string, status: number, data: TData, isPublic: boolean) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.status = status;
    this.data = data;
    this.isPublic = isPublic;
    this.isOperational = true; // This is required since bluebird 4 doesn't append it anymore.
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Class representing an API error.
 * @extends ExtendableError
 */
class APIError<TData extends null | object = null | { [key: string]: unknown }> extends ExtendableError<TData> {
  /**
   * Creates an API error.
   * @param {string} message - Error message.
   * @param {number} status - HTTP status code of error.
   * @param {object} data - response data to be returned.
   * @param {boolean} isPublic - Whether the message should be visible to user or not.
   */
  constructor(
    message: string,
    status: number = httpStatus.INTERNAL_SERVER_ERROR,
    data: TData = null,
    isPublic = false,
  ) {
    super(message, status, data, isPublic);
  }
}

export default APIError;
