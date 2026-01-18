export type ByteRange = {
    end: number;
    start: number;
};
export type ParseRangeResult = {
    range: ByteRange;
    type: 'partial';
} | {
    range: null;
    type: 'full';
} | {
    range: null;
    type: 'invalid';
};
/**
 * Parses HTTP Range header according to RFC 7233
 *
 * @returns Result object indicating whether to serve full file, partial content, or invalid range
 */
export declare function parseRangeHeader({ fileSize, rangeHeader, }: {
    fileSize: number;
    rangeHeader: null | string;
}): ParseRangeResult;
//# sourceMappingURL=parseRangeHeader.d.ts.map