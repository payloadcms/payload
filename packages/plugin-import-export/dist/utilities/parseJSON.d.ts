import type { PayloadRequest } from 'payload';
export type ParseJSONArgs = {
    data: Buffer | string;
    req: PayloadRequest;
};
/**
 * Parses JSON data into an array of record objects.
 * Validates that the input is an array of documents.
 */
export declare const parseJSON: ({ data, req }: ParseJSONArgs) => Record<string, unknown>[];
//# sourceMappingURL=parseJSON.d.ts.map