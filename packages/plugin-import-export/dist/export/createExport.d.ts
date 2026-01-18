import type { PayloadRequest, Sort, Where } from 'payload';
export type Export = {
    /**
     * Number of documents to process in each batch during export
     * @default 100
     */
    batchSize?: number;
    collectionSlug: string;
    /**
     * If true, enables debug logging
     */
    debug?: boolean;
    drafts?: 'no' | 'yes';
    exportsCollection: string;
    fields?: string[];
    format: 'csv' | 'json';
    globals?: string[];
    id: number | string;
    limit?: number;
    locale?: string;
    name: string;
    page?: number;
    slug: string;
    sort: Sort;
    userCollection: string;
    userID: number | string;
    where?: Where;
};
export type CreateExportArgs = {
    /**
     * If true, stream the file instead of saving it
     */
    download?: boolean;
    req: PayloadRequest;
} & Export;
export declare const createExport: (args: CreateExportArgs) => Promise<Response | undefined>;
//# sourceMappingURL=createExport.d.ts.map