import type { SerializedLexicalNode } from 'lexical';
import type { HTMLConverterAsync, HTMLConvertersAsync } from '../async/types.js';
import type { HTMLConverter, HTMLConverters } from '../sync/types.js';
export declare function findConverterForNode<TConverters extends HTMLConverters | HTMLConvertersAsync, TConverter extends HTMLConverter | HTMLConverterAsync>({ converters, disableIndent, disableTextAlign, node, unknownConverter, }: {
    converters: TConverters;
    disableIndent?: boolean | string[];
    disableTextAlign?: boolean | string[];
    node: SerializedLexicalNode;
    unknownConverter: TConverter;
}): {
    converterForNode: TConverter | undefined;
    providedCSSString: string;
    providedStyleTag: string;
};
//# sourceMappingURL=findConverterForNode.d.ts.map