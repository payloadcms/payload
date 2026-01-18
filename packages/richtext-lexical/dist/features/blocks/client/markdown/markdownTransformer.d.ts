import type { ClientBlock } from 'payload';
import { type Klass, type LexicalNode, type LexicalNodeReplacement } from 'lexical';
import type { Transformer } from '../../../../packages/@lexical/markdown/index.js';
import type { MultilineElementTransformer, TextMatchTransformer } from '../../../../packages/@lexical/markdown/MarkdownTransformers.js';
export declare const getBlockMarkdownTransformers: ({ blocks, inlineBlocks, }: {
    blocks: ClientBlock[];
    inlineBlocks: ClientBlock[];
}) => ((props: {
    allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>;
    allTransformers: Transformer[];
}) => MultilineElementTransformer | TextMatchTransformer)[];
//# sourceMappingURL=markdownTransformer.d.ts.map