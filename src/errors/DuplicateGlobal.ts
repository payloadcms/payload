import APIError from './APIError';

class DuplicateGlobal extends APIError {
  constructor(config) {
    super(`Global label "${config.label}" is already in use`);
  }
}

export default DuplicateGlobal;
