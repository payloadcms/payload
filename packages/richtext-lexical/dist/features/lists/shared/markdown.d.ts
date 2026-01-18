import type { ListNode, ListType } from '@lexical/list';
import type { ElementNode } from 'lexical';
import type { ElementTransformer } from '../../../packages/@lexical/markdown/MarkdownTransformers.js';
export declare const listReplace: (listType: ListType) => ElementTransformer["replace"];
export declare const listExport: (listNode: ListNode, exportChildren: (node: ElementNode) => string, depth: number) => string;
//# sourceMappingURL=markdown.d.ts.map