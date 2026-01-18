import type { Klass, LexicalNode, LexicalNodeReplacement } from 'lexical';
import { type Transformer } from '../../../../packages/@lexical/markdown/index.js';
export declare function getLexicalToMarkdown(allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>, allTransformers: Transformer[]): (args: {
    editorState: Record<string, any>;
}) => string;
//# sourceMappingURL=getLexicalToMarkdown.d.ts.map