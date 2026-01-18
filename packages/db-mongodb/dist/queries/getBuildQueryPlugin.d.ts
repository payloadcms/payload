import type { FlattenedField, Payload, Where } from 'payload';
type GetBuildQueryPluginArgs = {
    collectionSlug?: string;
    versionsFields?: FlattenedField[];
};
export type BuildQueryArgs = {
    globalSlug?: string;
    locale?: string;
    payload: Payload;
    where: Where;
};
export declare const getBuildQueryPlugin: ({ collectionSlug, versionsFields, }?: GetBuildQueryPluginArgs) => (schema: any) => void;
export {};
//# sourceMappingURL=getBuildQueryPlugin.d.ts.map