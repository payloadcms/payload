import type { Config, SanitizedConfig } from '../../config/types.js';
import type { GlobalConfig, SanitizedGlobalConfig } from './types.js';
export declare const sanitizeGlobal: (config: Config, global: GlobalConfig, richTextSanitizationPromises?: Array<(config: SanitizedConfig) => Promise<void>>, _validRelationships?: string[]) => Promise<SanitizedGlobalConfig>;
//# sourceMappingURL=sanitize.d.ts.map