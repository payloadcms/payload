import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';
import type { SerializedLexicalNodeWithParent } from '../shared/types.js';
import type { HTMLConverters, HTMLConvertersFunction } from './types.js';
export type ConvertLexicalToHTMLArgs = {
    /**
     * Override class names for the container.
     */
    className?: string;
    converters?: HTMLConverters | HTMLConvertersFunction;
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
};
export declare function convertLexicalToHTML({ className, converters, data, disableContainer, disableIndent, disableTextAlign, }: ConvertLexicalToHTMLArgs): string;
export declare function convertLexicalNodesToHTML({ converters, disableIndent, disableTextAlign, nodes, parent, }: {
    converters: HTMLConverters;
    disableIndent?: boolean | string[];
    disableTextAlign?: boolean | string[];
    nodes: SerializedLexicalNode[];
    parent: SerializedLexicalNodeWithParent;
}): string[];
//# sourceMappingURL=index.d.ts.map