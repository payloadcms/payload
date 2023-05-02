import { Payload } from '../payload';
import { CollectionModel } from '../collections/config/types';
type Args = {
    payload: Payload;
    Model: CollectionModel;
    max: number;
    slug: string;
    entityType: 'global' | 'collection';
    id?: string | number;
};
export declare const enforceMaxVersions: ({ payload, Model, max, slug, entityType, id, }: Args) => Promise<void>;
export {};
