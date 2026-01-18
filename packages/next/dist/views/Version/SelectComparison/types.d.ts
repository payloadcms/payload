import type { PaginatedDocs, SanitizedCollectionConfig } from 'payload';
import type { CompareOption } from '../Default/types.js';
export type Props = {
    collectionSlug?: string;
    docID?: number | string;
    globalSlug?: string;
    onChange: (val: CompareOption) => void;
    versionFromID?: string;
    versionFromOptions: CompareOption[];
};
type CLEAR = {
    required: boolean;
    type: 'CLEAR';
};
type ADD = {
    collection: SanitizedCollectionConfig;
    data: PaginatedDocs<any>;
    type: 'ADD';
};
export type Action = ADD | CLEAR;
export type ValueWithRelation = {
    relationTo: string;
    value: string;
};
export {};
//# sourceMappingURL=types.d.ts.map