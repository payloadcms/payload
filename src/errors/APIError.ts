/* eslint-disable max-classes-per-file */
import httpStatus from 'http-status';

class ExtendableError extends Error {
  status: number;

  data: {[key: string]: unknown};

  isPublic: boolean;

  isOperational: boolean;

  constructor(message: string, status: number, data: { [key: string]: unknown }, isPublic: boolean) {
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
class APIError extends ExtendableError {
  /**
   * Creates an API error.
   * @param {string} message - Error message.
   * @param {number} status - HTTP status code of error.
   * @param {object} data - response data to be returned.
   * @param {boolean} isPublic - Whether the message should be visible to user or not.
   */
  constructor(message: string, status: number = httpStatus.INTERNAL_SERVER_ERROR, data: any = null, isPublic = false) {
    super(message, status, data, isPublic);
  }
}

export default APIError;
