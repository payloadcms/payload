import type { SanitizedCollectionConfig } from '../collections/config/types.js';
import type { SanitizedConfig } from '../config/types.js';
import type { Field, FlattenedField } from '../fields/config/types.js';
export declare const buildVersionCollectionFields: <T extends boolean = false>(config: SanitizedConfig, collection: SanitizedCollectionConfig, flatten?: T) => true extends T ? FlattenedField[] : Field[];
//# sourceMappingURL=buildCollectionFields.d.ts.map