import type { CollectionConfig, Document, PayloadRequest } from 'payload';
import type { NestedDocsPluginConfig } from '../types.js';
export declare const getParents: (req: PayloadRequest, pluginConfig: Pick<NestedDocsPluginConfig, "generateLabel" | "generateURL" | "parentFieldSlug">, collection: CollectionConfig, doc: Record<string, unknown>, docs?: Array<Record<string, unknown>>) => Promise<Document[]>;
//# sourceMappingURL=getParents.d.ts.map