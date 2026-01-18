import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';
import type { SerializedLexicalNodeWithParent } from '../shared/types.js';
import type { HTMLConvertersAsync, HTMLConvertersFunctionAsync, HTMLPopulateFn } from './types.js';
export type ConvertLexicalToHTMLAsyncArgs = {
    /**
     * Override class names for the container.
     */
    className?: string;
    converters?: HTMLConvertersAsync | HTMLConvertersFunctionAsync;
    data: SerializedEditorState;
    /**
     * If true, removes the container div wrapper.
     */
    disableContainer?: boolean;
    /**
     * If true, disables indentation globally. If an array, disables for specific node `type` values.
     */
    disableIndent?: boolean | string[];
    /**
     * If true, disables text alignment globally. If an array, disables for specific node `type` values.
     */
    disableTextAlign?: boolean | string[];
    populate?: HTMLPopulateFn;
};
export declare function convertLexicalToHTMLAsync({ className, converters, data, disableContainer, disableIndent, disableTextAlign, populate, }: ConvertLexicalToHTMLAsyncArgs): Promise<string>;
export declare function convertLexicalNodesToHTMLAsync({ converters, disableIndent, disableTextAlign, nodes, parent, populate, }: {
    converters: HTMLConvertersAsync;
    disableIndent?: boolean | string[];
    disableTextAlign?: boolean | string[];
    nodes: SerializedLexicalNode[];
    parent: SerializedLexicalNodeWithParent;
    populate?: HTMLPopulateFn;
}): Promise<string[]>;
//# sourceMappingURL=index.d.ts.map