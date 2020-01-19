import APIError from './APIError';

export class MissingGlobalLabel extends APIError {
  constructor(config) {
    super(`${config.globals} object is missing label`);
  }
}
