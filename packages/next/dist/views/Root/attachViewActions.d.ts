import type { CustomComponent, EditConfig, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload';
export declare function getViewActions({ editConfig, viewKey, }: {
    editConfig: EditConfig;
    viewKey: keyof EditConfig;
}): CustomComponent[];
export declare function getSubViewActions({ collectionOrGlobal, viewKeyArg, }: {
    collectionOrGlobal: SanitizedCollectionConfig | SanitizedGlobalConfig;
    viewKeyArg?: keyof EditConfig;
}): CustomComponent[];
//# sourceMappingURL=attachViewActions.d.ts.map