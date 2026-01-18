import { type Point } from './point.js';
interface ContainsPointReturn {
    reason: {
        isOnBottomSide: boolean;
        isOnLeftSide: boolean;
        isOnRightSide: boolean;
        isOnTopSide: boolean;
    };
    result: boolean;
}
export declare class Rect {
    private readonly _bottom;
    private readonly _left;
    private readonly _right;
    private readonly _top;
    constructor(left: number, top: number, right: number, bottom: number);
    static fromDOM(dom: HTMLElement): Rect;
    static fromDOMRect(domRect: DOMRect): Rect;
    static fromLTRB(left: number, top: number, right: number, bottom: number): Rect;
    static fromLWTH(left: number, width: number, top: number, height: number): Rect;
    static fromPoints(startPoint: Point, endPoint: Point): Rect;
    contains({ x, y }: Point): ContainsPointReturn;
    contains({ bottom, left, right, top }: Rect): boolean;
    distanceFromPoint(point: Point): {
        distance: number;
        isOnBottomSide: boolean;
        isOnLeftSide: boolean;
        isOnRightSide: boolean;
        isOnTopSide: boolean;
    };
    equals({ bottom, left, right, top }: Rect): boolean;
    generateNewRect({ bottom, left, right, top, }: {
        bottom?: number | undefined;
        left?: number | undefined;
        right?: number | undefined;
        top?: number | undefined;
    }): Rect;
    intersectsWith(rect: Rect): boolean;
    get bottom(): number;
    get height(): number;
    get left(): number;
    get right(): number;
    get top(): number;
    get width(): number;
}
export {};
//# sourceMappingURL=rect.d.ts.map