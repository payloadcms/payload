import type { SanitizedConfig } from '../config/types.js';
import type { Field, FlattenedField } from '../fields/config/types.js';
import type { SanitizedGlobalConfig } from '../globals/config/types.js';
export declare const buildVersionGlobalFields: <T extends boolean = false>(config: SanitizedConfig, global: SanitizedGlobalConfig, flatten?: T) => true extends T ? FlattenedField[] : Field[];
//# sourceMappingURL=buildGlobalFields.d.ts.map