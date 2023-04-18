import { SanitizedCollectionConfig } from './config/types';
import { Endpoint } from '../config/types';
declare const buildEndpoints: (collection: SanitizedCollectionConfig) => Endpoint[];
export default buildEndpoints;
