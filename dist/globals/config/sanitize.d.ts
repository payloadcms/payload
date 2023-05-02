import { CollectionConfig } from '../../collections/config/types';
import { GlobalConfig, SanitizedGlobalConfig } from './types';
declare const sanitizeGlobals: (collections: CollectionConfig[], globals: GlobalConfig[]) => SanitizedGlobalConfig[];
export default sanitizeGlobals;
