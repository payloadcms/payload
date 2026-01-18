import { type DBIdentifierName } from 'payload';
type Args = {
    config: {
        dbName?: DBIdentifierName;
        enumName?: DBIdentifierName;
        name?: string;
        slug?: string;
    };
    locales?: boolean;
    target?: 'dbName' | 'enumName';
    versions?: boolean;
};
/**
 * Used to name database enums and collections
 * Returns the collection or enum name for a given entity
 */
export declare const getDBName: ({ config: { name, slug }, config, target, versions, }: Args) => string;
export {};
//# sourceMappingURL=getDBName.d.ts.map