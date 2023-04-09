import type { JSONSchema4 } from 'json-schema';
import { SanitizedCollectionConfig } from '../collections/config/types';
import { SanitizedGlobalConfig } from '../globals/config/types';
import { SanitizedConfig } from '../config/types';
export declare function entityToJSONSchema(config: SanitizedConfig, incomingEntity: SanitizedCollectionConfig | SanitizedGlobalConfig): JSONSchema4;
export declare function generateEntityObject(config: SanitizedConfig, type: 'collections' | 'globals'): JSONSchema4;
