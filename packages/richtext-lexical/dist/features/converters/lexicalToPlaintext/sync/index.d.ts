import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';
import type { SerializedLexicalNodeWithParent } from '../shared/types.js';
import type { PlaintextConverters } from './types.js';
export type ConvertLexicalToPlaintextArgs = {
    /**
     * A map of node types to their corresponding plaintext converter functions.
     * This is optional - if not provided, the following heuristic will be used:
     *
     * - If the node has a `text` property, it will be used as the plaintext.
     * - If the node has a `children` property, the children will be recursively converted to plaintext.
     * - If the node has neither, it will be ignored.
     **/
    converters?: PlaintextConverters;
    data: SerializedEditorState;
};
export declare function convertLexicalToPlaintext({ converters, data, }: ConvertLexicalToPlaintextArgs): string;
export declare function convertLexicalNodesToPlaintext({ converters, nodes, parent, }: {
    converters: PlaintextConverters;
    nodes: SerializedLexicalNode[];
    parent: SerializedLexicalNodeWithParent;
}): string[];
//# sourceMappingURL=index.d.ts.map