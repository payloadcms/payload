import { type AllOperations, type DefaultDocumentIDType, type PayloadRequest, type Where } from '../../index.js';
/**
 * Returns whether or not the entity doc exists based on the where query.
 */
export declare function entityDocExists({ id, slug, entityType, locale, operation, req, where, }: {
    entityType: 'collection' | 'global';
    id?: DefaultDocumentIDType;
    locale?: string;
    operation?: AllOperations;
    req: PayloadRequest;
    slug: string;
    where: Where;
}): Promise<boolean>;
//# sourceMappingURL=entityDocExists.d.ts.map