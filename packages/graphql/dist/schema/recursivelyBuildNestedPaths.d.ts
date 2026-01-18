import type { FieldWithSubFields, TabsField } from 'payload';
type Args = {
    field: FieldWithSubFields | TabsField;
    nestedFieldName2: string;
    parentName: string;
};
export declare const recursivelyBuildNestedPaths: ({ field, nestedFieldName2, parentName }: Args) => any;
export {};
//# sourceMappingURL=recursivelyBuildNestedPaths.d.ts.map