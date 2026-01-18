import type { Klass, LexicalNode, LexicalNodeReplacement } from 'lexical';
import type { NodeWithHooks } from '../../features/typesServer.js';
import type { SanitizedClientEditorConfig, SanitizedServerEditorConfig } from '../config/types.js';
export declare function getEnabledNodes({ editorConfig, }: {
    editorConfig: SanitizedClientEditorConfig | SanitizedServerEditorConfig;
}): Array<Klass<LexicalNode> | LexicalNodeReplacement>;
export declare function getEnabledNodesFromServerNodes({ nodes, }: {
    nodes: Array<Klass<LexicalNode> | LexicalNodeReplacement> | Array<NodeWithHooks>;
}): Array<Klass<LexicalNode> | LexicalNodeReplacement>;
//# sourceMappingURL=index.d.ts.map