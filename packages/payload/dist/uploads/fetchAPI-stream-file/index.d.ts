import fs from 'fs';
export declare function iteratorToStream(iterator: AsyncIterator<Uint8Array>): import("stream/web").ReadableStream<any>;
export declare function nodeStreamToIterator(stream: fs.ReadStream): AsyncGenerator<Uint8Array<any>, void, unknown>;
export declare function streamFile({ filePath, options, }: {
    filePath: string;
    options?: {
        end?: number;
        start?: number;
    };
}): ReadableStream;
//# sourceMappingURL=index.d.ts.map