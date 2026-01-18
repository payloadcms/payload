import type { SerializedLexicalNode } from 'lexical';
export declare function recurseNodes({ callback, nodes, }: {
    callback: (node: SerializedLexicalNode) => void;
    nodes: SerializedLexicalNode[];
}): void;
export declare function recurseNodesAsync({ callback, nodes, }: {
    callback: (node: SerializedLexicalNode) => Promise<void>;
    nodes: SerializedLexicalNode[];
}): Promise<void>;
//# sourceMappingURL=forEachNodeRecursively.d.ts.map