import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';
import React from 'react';
import type { JSXConverters, SerializedLexicalNodeWithParent } from './types.js';
export type ConvertLexicalToJSXArgs = {
    converters: JSXConverters;
    data: SerializedEditorState;
    disableIndent?: boolean | string[];
    disableTextAlign?: boolean | string[];
};
export declare function convertLexicalToJSX({ converters, data, disableIndent, disableTextAlign, }: ConvertLexicalToJSXArgs): React.ReactNode;
export declare function convertLexicalNodesToJSX({ converters, disableIndent, disableTextAlign, nodes, parent, }: {
    converters: JSXConverters;
    disableIndent?: boolean | string[];
    disableTextAlign?: boolean | string[];
    nodes: SerializedLexicalNode[];
    parent: SerializedLexicalNodeWithParent;
}): React.ReactNode[];
//# sourceMappingURL=index.d.ts.map