import httpStatus from 'http-status';
import APIError from './APIError';

class FileUploadError extends APIError {
  constructor() {
    super('There was a problem while uploading the file.', httpStatus.BAD_REQUEST);
  }
}

export default FileUploadError;
