import { Payload } from '../payload';
type Args = {
    payload: Payload;
    slug: string;
    id?: string | number;
};
export declare const deleteCollectionVersions: ({ payload, slug, id, }: Args) => Promise<void>;
export {};
