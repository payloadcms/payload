import type { RichTextAdapterProvider } from 'payload';
import type { AdapterArguments } from './types.js';
/**
 * @deprecated - slate will be removed in 4.0. Please [migrate our new, lexical-based rich text editor](https://payloadcms.com/docs/rich-text/migration#migrating-from-slate).
 */
export declare function slateEditor(args: AdapterArguments): RichTextAdapterProvider<any[], AdapterArguments, any>;
export type { AdapterArguments, ElementNode, RichTextCustomElement, RichTextCustomLeaf, RichTextElement, RichTextLeaf, RichTextPlugin, RichTextPluginComponent, SlateFieldProps, TextNode, } from './types.js';
export { nodeIsTextNode } from './types.js';
//# sourceMappingURL=index.d.ts.map