import httpStatus from 'http-status';
import APIError from './APIError';

class MissingFile extends APIError {
  constructor() {
    super('No files were uploaded.', httpStatus.BAD_REQUEST);
  }
}

module.exports = MissingFile;
