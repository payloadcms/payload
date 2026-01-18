import type { Plugin } from 'payload';
import type { NestedDocsPluginConfig } from './types.js';
import { createBreadcrumbsField } from './fields/breadcrumbs.js';
import { createParentField } from './fields/parent.js';
import { getParents } from './utilities/getParents.js';
export { createBreadcrumbsField, createParentField, getParents };
export declare const nestedDocsPlugin: (pluginConfig: NestedDocsPluginConfig) => Plugin;
//# sourceMappingURL=index.d.ts.map