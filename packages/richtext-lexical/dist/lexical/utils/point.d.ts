export declare class Point {
    private readonly _x;
    private readonly _y;
    constructor(x: number, y: number);
    calcDeltaXTo({ x }: Point): number;
    calcDeltaYTo({ y }: Point): number;
    calcDistanceTo(point: Point): number;
    calcHorizontalDistanceTo(point: Point): number;
    calcVerticalDistance(point: Point): number;
    equals({ x, y }: Point): boolean;
    get x(): number;
    get y(): number;
}
export declare function isPoint(x: unknown): x is Point;
//# sourceMappingURL=point.d.ts.map