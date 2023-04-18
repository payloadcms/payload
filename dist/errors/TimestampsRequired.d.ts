import { CollectionConfig } from '../collections/config/types';
import APIError from './APIError';
declare class TimestampsRequired extends APIError {
    constructor(collection: CollectionConfig);
}
export default TimestampsRequired;
