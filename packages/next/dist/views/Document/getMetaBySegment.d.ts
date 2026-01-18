import type { Metadata } from 'next';
import type { EditConfig, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload';
import type { GenerateViewMetadata } from '../Root/index.js';
export type GenerateEditViewMetadata = (args: {
    collectionConfig?: null | SanitizedCollectionConfig;
    globalConfig?: null | SanitizedGlobalConfig;
    isReadOnly?: boolean;
    view?: keyof EditConfig;
} & Parameters<GenerateViewMetadata>[0]) => Promise<Metadata>;
export declare const getMetaBySegment: GenerateEditViewMetadata;
//# sourceMappingURL=getMetaBySegment.d.ts.map