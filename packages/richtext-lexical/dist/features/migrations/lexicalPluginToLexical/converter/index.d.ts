import type { SerializedEditorState, SerializedLexicalNode, SerializedParagraphNode, SerializedTextNode } from 'lexical';
import type { LexicalPluginNodeConverter, PayloadPluginLexicalData } from './types.js';
export declare function convertLexicalPluginToLexical({ converters, lexicalPluginData, quiet, }: {
    converters: LexicalPluginNodeConverter[];
    lexicalPluginData: PayloadPluginLexicalData;
    quiet?: boolean;
}): SerializedEditorState;
export declare function convertLexicalPluginNodesToLexical({ converters, lexicalPluginNodes, parentNodeType, quiet, }: {
    converters: LexicalPluginNodeConverter[];
    lexicalPluginNodes: SerializedLexicalNode[] | undefined;
    /**
     * Type of the parent lexical node (not the type of the original, parent payload-plugin-lexical type)
     */
    parentNodeType: string;
    quiet?: boolean;
}): SerializedLexicalNode[];
export declare function convertParagraphNode(converters: LexicalPluginNodeConverter[], node: SerializedLexicalNode, quiet?: boolean): SerializedParagraphNode;
export declare function convertTextNode(node: SerializedLexicalNode): SerializedTextNode;
//# sourceMappingURL=index.d.ts.map