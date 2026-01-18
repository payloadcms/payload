import type { Klass, LexicalNode, LexicalNodeReplacement, SerializedEditorState } from 'lexical';
import { type Transformer } from '../../../../packages/@lexical/markdown/index.js';
export declare function getMarkdownToLexical(allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>, allTransformers: Transformer[]): (args: {
    markdown: string;
}) => SerializedEditorState;
//# sourceMappingURL=getMarkdownToLexical.d.ts.map