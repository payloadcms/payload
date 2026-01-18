import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';
import type { Payload, PayloadRequest } from 'payload';
import type { HTMLConverter, SerializedLexicalNodeWithParent } from './types.js';
/**
 * @deprecated - will be removed in 4.0
 */
export type ConvertLexicalToHTMLArgs = {
    converters: HTMLConverter[];
    currentDepth?: number;
    data: SerializedEditorState;
    depth?: number;
    draft?: boolean;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
} & ({
    /**
     * This payload property will only be used if req is undefined.
     */
    payload?: never;
    /**
     * When the converter is called, req CAN be passed in depending on where it's run.
     * If this is undefined and config is passed through, lexical will create a new req object for you. If this is null or
     * config is undefined, lexical will not create a new req object for you and local API / server-side-only
     * functionality will be disabled.
     */
    req: PayloadRequest;
} | {
    /**
     * This payload property will only be used if req is undefined.
     */
    payload?: Payload;
    /**
     * When the converter is called, req CAN be passed in depending on where it's run.
     * If this is undefined and config is passed through, lexical will create a new req object for you. If this is null or
     * config is undefined, lexical will not create a new req object for you and local API / server-side-only
     * functionality will be disabled.
     */
    req?: null | undefined;
});
/**
 * @deprecated - will be removed in 4.0. Use the function exported from `@payloadcms/richtext-lexical/html` instead.
 * @example
 * ```ts
 * // old (deprecated)
 * import { convertLexicalToHTML } from '@payloadcms/richtext-lexical'
 * // new (recommended)
 * import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
 * ```
 * For more details, you can refer to https://payloadcms.com/docs/rich-text/converting-html to see all the
 * ways to convert lexical to HTML.
 */
export declare function convertLexicalToHTML({ converters, currentDepth, data, depth, draft, overrideAccess, payload, req, showHiddenFields, }: ConvertLexicalToHTMLArgs): Promise<string>;
/**
 * @deprecated - will be removed in 4.0
 */
export declare function convertLexicalNodesToHTML({ converters, currentDepth, depth, draft, lexicalNodes, overrideAccess, parent, req, showHiddenFields, }: {
    converters: HTMLConverter[];
    currentDepth: number;
    depth: number;
    draft: boolean;
    lexicalNodes: SerializedLexicalNode[];
    overrideAccess: boolean;
    parent: SerializedLexicalNodeWithParent;
    /**
     * When the converter is called, req CAN be passed in depending on where it's run.
     */
    req: null | PayloadRequest;
    showHiddenFields: boolean;
}): Promise<string>;
//# sourceMappingURL=index.d.ts.map