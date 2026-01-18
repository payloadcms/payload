import type { DecoratorNode, ElementNode, LexicalNode } from 'lexical';
import './index.scss';
export declare function DecoratorPlugin(): null;
/**
 * Copied from https://github.com/facebook/lexical/blob/main/packages/lexical/src/LexicalUtils.ts
 *
 * This function returns true for a DecoratorNode that is not inline OR
 * an ElementNode that is:
 * - not a root or shadow root
 * - not inline
 * - can't be empty
 * - has no children or an inline first child
 */
export declare function INTERNAL_$isBlock(node: LexicalNode): node is DecoratorNode<unknown> | ElementNode;
//# sourceMappingURL=index.d.ts.map