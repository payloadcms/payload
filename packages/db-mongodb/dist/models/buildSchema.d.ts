import type { Schema, SchemaOptions } from 'mongoose';
import { type Field, type FlattenedField, type Payload, type SanitizedCompoundIndex } from 'payload';
export type BuildSchemaOptions = {
    allowIDField?: boolean;
    disableUnique?: boolean;
    draftsEnabled?: boolean;
    indexSortableFields?: boolean;
    options?: SchemaOptions;
};
export declare const buildSchema: (args: {
    buildSchemaOptions: BuildSchemaOptions;
    compoundIndexes?: SanitizedCompoundIndex[];
    configFields: Field[];
    flattenedFields?: FlattenedField[];
    parentIsLocalized?: boolean;
    payload: Payload;
}) => Schema;
//# sourceMappingURL=buildSchema.d.ts.map