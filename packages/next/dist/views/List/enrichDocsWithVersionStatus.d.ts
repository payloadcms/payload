import type { PaginatedDocs, PayloadRequest, SanitizedCollectionConfig } from 'payload';
/**
 * Enriches list view documents with correct draft status display.
 * When draft=true is used in the query, Payload returns the latest draft version if it exists.
 * This function checks if draft documents also have a published version to determine "changed" status.
 *
 * Performance: Uses a single query to find all documents with "changed" status instead of N queries.
 */
export declare function enrichDocsWithVersionStatus({ collectionConfig, data, req, }: {
    collectionConfig: SanitizedCollectionConfig;
    data: PaginatedDocs;
    req: PayloadRequest;
}): Promise<PaginatedDocs>;
//# sourceMappingURL=enrichDocsWithVersionStatus.d.ts.map