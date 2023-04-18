import { Config as GeneratedTypes } from 'payload/generated-types';
import { Payload } from '../../../payload';
import { Document, Where } from '../../../types';
import { PaginatedDocs } from '../../../mongoose/types';
import { TypeWithVersion } from '../../../versions/types';
export type Options<T extends keyof GeneratedTypes['collections']> = {
    collection: T;
    depth?: number;
    page?: number;
    limit?: number;
    locale?: string;
    fallbackLocale?: string;
    user?: Document;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
    sort?: string;
    where?: Where;
};
export default function findVersionsLocal<T extends keyof GeneratedTypes['collections']>(payload: Payload, options: Options<T>): Promise<PaginatedDocs<TypeWithVersion<GeneratedTypes['collections'][T]>>>;
