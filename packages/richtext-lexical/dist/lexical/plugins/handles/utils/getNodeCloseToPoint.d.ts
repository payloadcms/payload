import type { LexicalEditor, LexicalNode } from 'lexical';
import { Point } from '../../../utils/point.js';
type Props = {
    anchorElem: HTMLElement;
    cache_threshold?: number;
    editor: LexicalEditor;
    /** fuzzy makes the search not exact. If no exact match found, find the closes node instead of returning null */
    fuzzy?: boolean;
    horizontalOffset?: number;
    point: Point;
    /**
     * By default, empty paragraphs are not returned. Set this to true to return empty paragraphs. @default false
     */
    returnEmptyParagraphs?: boolean;
    /**
     * The index to start searching from. It can be a considerable performance optimization to start searching from the index of the
     * previously found node, as the node is likely to be close to the next node.
     */
    startIndex?: number;
    useEdgeAsDefault?: boolean;
    verbose?: boolean;
};
type Output = {
    blockElem: HTMLElement | null;
    blockNode: LexicalNode | null;
    foundAtIndex: number;
    isFoundNodeEmptyParagraph: boolean;
};
export declare function getNodeCloseToPoint(props: Props): Output;
export {};
//# sourceMappingURL=getNodeCloseToPoint.d.ts.map