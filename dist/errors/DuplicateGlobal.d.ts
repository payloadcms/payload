import { GlobalConfig } from '../globals/config/types';
import APIError from './APIError';
declare class DuplicateGlobal extends APIError {
    constructor(config: GlobalConfig);
}
export default DuplicateGlobal;
