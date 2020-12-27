import httpStatus from 'http-status';
import APIError from './APIError';

class ErrorDeletingFile extends APIError {
  constructor() {
    super('There was an error deleting file.', httpStatus.INTERNAL_SERVER_ERROR);
  }
}

export default ErrorDeletingFile;
