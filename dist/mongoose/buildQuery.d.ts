import { PayloadRequest, Where } from '../types';
import { Field, FieldAffectingData, TabAsField, UIField } from '../fields/config/types';
import { CollectionPermission, FieldPermissions, GlobalPermission } from '../auth';
import { SanitizedConfig } from '../config/types';
type PathToQuery = {
    complete: boolean;
    collectionSlug?: string;
    path: string;
    field: Field | TabAsField;
    fields?: (FieldAffectingData | UIField | TabAsField)[];
    fieldPolicies?: {
        [field: string]: FieldPermissions;
    };
};
type SearchParam = {
    path?: string;
    value: unknown;
};
type ParamParserArgs = {
    req: PayloadRequest;
    collectionSlug?: string;
    globalSlug?: string;
    versionsFields?: Field[];
    model: any;
    where: Where;
    overrideAccess?: boolean;
};
export declare class ParamParser {
    collectionSlug?: string;
    globalSlug?: string;
    overrideAccess: boolean;
    req: PayloadRequest;
    where: Where;
    model: any;
    fields: Field[];
    localizationConfig: SanitizedConfig['localization'];
    policies: {
        collections?: {
            [collectionSlug: string]: CollectionPermission;
        };
        globals?: {
            [globalSlug: string]: GlobalPermission;
        };
    };
    errors: {
        path: string;
    }[];
    constructor({ req, collectionSlug, globalSlug, versionsFields, model, where, overrideAccess, }: ParamParserArgs);
    parse(): Promise<Record<string, unknown>>;
    parsePathOrRelation(object: Where): Promise<Record<string, unknown>>;
    buildAndOrConditions(conditions: any): Promise<any[]>;
    buildSearchParam({ fields, incomingPath, val, operator, }: {
        fields: Field[];
        incomingPath: string;
        val: unknown;
        operator: string;
    }): Promise<SearchParam>;
    getLocalizedPaths({ collectionSlug, globalSlug, fields, incomingPath, }: {
        collectionSlug?: string;
        globalSlug?: string;
        fields: Field[];
        incomingPath: string;
    }): Promise<PathToQuery[]>;
}
type GetBuildQueryPluginArgs = {
    collectionSlug?: string;
    versionsFields?: Field[];
};
export type BuildQueryArgs = {
    req: PayloadRequest;
    where: Where;
    overrideAccess: boolean;
    globalSlug?: string;
};
declare const getBuildQueryPlugin: ({ collectionSlug, versionsFields, }?: GetBuildQueryPluginArgs) => (schema: any) => void;
export default getBuildQueryPlugin;
