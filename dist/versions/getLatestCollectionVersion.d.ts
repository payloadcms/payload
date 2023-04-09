import { Payload } from '../payload';
import { CollectionModel, SanitizedCollectionConfig, TypeWithID } from '../collections/config/types';
type Args = {
    payload: Payload;
    query: Record<string, unknown>;
    lean?: boolean;
    id: string | number;
    Model: CollectionModel;
    config: SanitizedCollectionConfig;
};
export declare const getLatestCollectionVersion: <T extends TypeWithID = any>({ payload, config, Model, query, id, lean, }: Args) => Promise<T>;
export {};
