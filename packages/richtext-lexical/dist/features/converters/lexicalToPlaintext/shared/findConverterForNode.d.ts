import type { SerializedLexicalNode } from 'lexical';
import type { PlaintextConverter, PlaintextConverters } from '../sync/types.js';
export declare function findConverterForNode<TConverters extends PlaintextConverters, TConverter extends PlaintextConverter<any>>({ converters, node, }: {
    converters: TConverters;
    node: SerializedLexicalNode;
}): TConverter | undefined;
//# sourceMappingURL=findConverterForNode.d.ts.map