import { PayloadGlobalConfig } from '../globals/config/types';
import APIError from './APIError';

class DuplicateGlobal extends APIError {
  constructor(config: PayloadGlobalConfig) {
    super(`Global label "${config.label}" is already in use`);
  }
}

export default DuplicateGlobal;
