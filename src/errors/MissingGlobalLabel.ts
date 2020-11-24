import { Config } from '../config/types';
import APIError from './APIError';

class MissingGlobalLabel extends APIError {
  constructor(config: Config) {
    super(`${config.globals} object is missing label`);
  }
}

export default MissingGlobalLabel;
