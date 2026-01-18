import type { ArrayField, BlocksField, CheckboxField, CodeField, CollapsibleField, DateField, EmailField, GraphQLInfo, GroupField, JoinField, JSONField, NumberField, PointField, RadioField, RelationshipField, RichTextField, RowField, SanitizedConfig, SelectField, TabsField, TextareaField, TextField, UploadField } from 'payload';
import { GraphQLObjectType } from 'graphql';
import { type ObjectTypeConfig } from './buildObjectType.js';
type SharedArgs = {
    collectionSlug?: string;
    config: SanitizedConfig;
    forceNullable?: boolean;
    graphqlResult: GraphQLInfo;
    newlyCreatedBlockType: GraphQLObjectType;
    objectTypeConfig: ObjectTypeConfig;
    parentIsLocalized?: boolean;
    parentName: string;
};
type FieldToSchemaMap = {
    array: (args: {
        field: ArrayField;
    } & SharedArgs) => ObjectTypeConfig;
    blocks: (args: {
        field: BlocksField;
    } & SharedArgs) => ObjectTypeConfig;
    checkbox: (args: {
        field: CheckboxField;
    } & SharedArgs) => ObjectTypeConfig;
    code: (args: {
        field: CodeField;
    } & SharedArgs) => ObjectTypeConfig;
    collapsible: (args: {
        field: CollapsibleField;
    } & SharedArgs) => ObjectTypeConfig;
    date: (args: {
        field: DateField;
    } & SharedArgs) => ObjectTypeConfig;
    email: (args: {
        field: EmailField;
    } & SharedArgs) => ObjectTypeConfig;
    group: (args: {
        field: GroupField;
    } & SharedArgs) => ObjectTypeConfig;
    join: (args: {
        field: JoinField;
    } & SharedArgs) => ObjectTypeConfig;
    json: (args: {
        field: JSONField;
    } & SharedArgs) => ObjectTypeConfig;
    number: (args: {
        field: NumberField;
    } & SharedArgs) => ObjectTypeConfig;
    point: (args: {
        field: PointField;
    } & SharedArgs) => ObjectTypeConfig;
    radio: (args: {
        field: RadioField;
    } & SharedArgs) => ObjectTypeConfig;
    relationship: (args: {
        field: RelationshipField;
    } & SharedArgs) => ObjectTypeConfig;
    richText: (args: {
        field: RichTextField;
    } & SharedArgs) => ObjectTypeConfig;
    row: (args: {
        field: RowField;
    } & SharedArgs) => ObjectTypeConfig;
    select: (args: {
        field: SelectField;
    } & SharedArgs) => ObjectTypeConfig;
    tabs: (args: {
        field: TabsField;
    } & SharedArgs) => ObjectTypeConfig;
    text: (args: {
        field: TextField;
    } & SharedArgs) => ObjectTypeConfig;
    textarea: (args: {
        field: TextareaField;
    } & SharedArgs) => ObjectTypeConfig;
    upload: (args: {
        field: UploadField;
    } & SharedArgs) => ObjectTypeConfig;
};
export declare const fieldToSchemaMap: FieldToSchemaMap;
export {};
//# sourceMappingURL=fieldToSchemaMap.d.ts.map