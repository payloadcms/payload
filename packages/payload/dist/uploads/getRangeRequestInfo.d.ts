export type RangeRequestResult = {
    headers: {
        'Accept-Ranges': string;
        'Content-Length': string;
        'Content-Range'?: string;
    };
    rangeEnd: number;
    rangeStart: number;
    status: 206;
    type: 'partial';
} | {
    headers: {
        'Accept-Ranges': string;
        'Content-Length': string;
    };
    status: 200;
    type: 'full';
} | {
    headers: {
        'Content-Range': string;
    };
    status: 416;
    type: 'invalid';
};
/**
 * Gets HTTP Range request information according to RFC 7233
 *
 * @param fileSize - The total size of the file in bytes
 * @param rangeHeader - The Range header value from the request (e.g., "bytes=0-1023")
 * @returns Result object with headers and status code for the response
 */
export declare function getRangeRequestInfo({ fileSize, rangeHeader, }: {
    fileSize: number;
    rangeHeader: null | string;
}): RangeRequestResult;
//# sourceMappingURL=getRangeRequestInfo.d.ts.map