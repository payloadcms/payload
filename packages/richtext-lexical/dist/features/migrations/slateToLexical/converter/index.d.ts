import type { SerializedEditorState, SerializedLexicalNode, SerializedParagraphNode, SerializedTextNode } from 'lexical';
import type { SlateNode, SlateNodeConverter } from './types.js';
export declare function convertSlateToLexical({ converters, slateData, }: {
    converters: SlateNodeConverter[];
    slateData: SlateNode[];
}): SerializedEditorState;
export declare function convertSlateNodesToLexical({ canContainParagraphs, converters, parentNodeType, slateNodes, }: {
    canContainParagraphs: boolean;
    converters: SlateNodeConverter[] | undefined;
    /**
     * Type of the parent lexical node (not the type of the original, parent slate type)
     */
    parentNodeType: string;
    slateNodes: SlateNode[];
}): SerializedLexicalNode[];
export declare function convertParagraphNode(converters: SlateNodeConverter[], node: SlateNode): SerializedParagraphNode;
export declare function convertTextNode(node: SlateNode): SerializedTextNode;
export declare function convertNodeToFormat(node: SlateNode): number;
//# sourceMappingURL=index.d.ts.map