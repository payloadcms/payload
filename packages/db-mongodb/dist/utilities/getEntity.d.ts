import type { Collection, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload';
import type { MongooseAdapter } from '../index.js';
import type { CollectionModel, GlobalModel } from '../types.js';
export declare const getCollection: ({ adapter, collectionSlug, versions, }: {
    adapter: MongooseAdapter;
    collectionSlug: string;
    versions?: boolean;
}) => {
    collectionConfig: SanitizedCollectionConfig;
    customIDType: Collection["customIDType"];
    Model: CollectionModel;
};
type BaseGetGlobalArgs = {
    adapter: MongooseAdapter;
    globalSlug: string;
};
interface GetGlobal {
    (args: {
        versions?: false | undefined;
    } & BaseGetGlobalArgs): {
        globalConfig: SanitizedGlobalConfig;
        Model: GlobalModel;
    };
    (args: {
        versions?: true;
    } & BaseGetGlobalArgs): {
        globalConfig: SanitizedGlobalConfig;
        Model: CollectionModel;
    };
}
export declare const getGlobal: GetGlobal;
export {};
//# sourceMappingURL=getEntity.d.ts.map