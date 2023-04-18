import { Endpoint } from '../config/types';
import { SanitizedGlobalConfig } from './config/types';
declare const buildEndpoints: (global: SanitizedGlobalConfig) => Endpoint[];
export default buildEndpoints;
