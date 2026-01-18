import type { PayloadRequest } from 'payload';
export type ImportMode = 'create' | 'update' | 'upsert';
export type Import = {
    /**
     * Number of documents to process in each batch during import
     * @default 100
     */
    batchSize?: number;
    collectionSlug: string;
    /**
     * If true, enabled debug logging
     */
    debug?: boolean;
    file?: {
        data: Buffer;
        mimetype: string;
        name: string;
    };
    format: 'csv' | 'json';
    id?: number | string;
    /**
     * Import mode: create, update or upset
     */
    importMode: ImportMode;
    matchField?: string;
    name: string;
    userCollection?: string;
    userID?: number | string;
};
export type CreateImportArgs = {
    defaultVersionStatus?: 'draft' | 'published';
    req: PayloadRequest;
} & Import;
export type ImportResult = {
    errors: Array<{
        doc: Record<string, unknown>;
        error: string;
        index: number;
    }>;
    imported: number;
    total: number;
    updated: number;
};
export declare const createImport: ({ batchSize, collectionSlug, debug, defaultVersionStatus, file, format, importMode, matchField, req, userCollection, userID, }: CreateImportArgs) => Promise<ImportResult>;
//# sourceMappingURL=createImport.d.ts.map