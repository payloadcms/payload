import type { BuildFormStateArgs, ClientFieldSchemaMap, Data, DocumentPreferences, Field, FieldSchemaMap, FormState, FormStateWithoutComponents, PayloadRequest, SanitizedFieldsPermissions, SelectMode, SelectType, TabAsField } from 'payload';
import type { AddFieldStatePromiseArgs } from './addFieldStatePromise.js';
import type { RenderFieldMethod } from './types.js';
type Args = {
    addErrorPathToParent: (fieldPath: string) => void;
    /**
     * if any parents is localized, then the field is localized. @default false
     */
    anyParentLocalized?: boolean;
    /**
     * Data of the nearest parent block, or undefined
     */
    blockData: Data | undefined;
    clientFieldSchemaMap?: ClientFieldSchemaMap;
    collectionSlug?: string;
    data: Data;
    fields: (Field | TabAsField)[];
    fieldSchemaMap: FieldSchemaMap;
    filter?: (args: AddFieldStatePromiseArgs) => boolean;
    /**
     * Force the value of fields like arrays or blocks to be the full value instead of the length @default false
     */
    forceFullValue?: boolean;
    fullData: Data;
    id?: number | string;
    /**
     * Whether the field schema should be included in the state. @default false
     */
    includeSchema?: boolean;
    mockRSCs?: BuildFormStateArgs['mockRSCs'];
    /**
     * Whether to omit parent fields in the state. @default false
     */
    omitParents?: boolean;
    /**
     * operation is only needed for validation
     */
    operation: 'create' | 'update';
    parentIndexPath: string;
    parentPassesCondition?: boolean;
    parentPath: string;
    parentSchemaPath: string;
    permissions: SanitizedFieldsPermissions;
    preferences?: DocumentPreferences;
    previousFormState: FormState;
    readOnly?: boolean;
    renderAllFields: boolean;
    renderFieldFn: RenderFieldMethod;
    req: PayloadRequest;
    select?: SelectType;
    selectMode?: SelectMode;
    /**
     * Whether to skip checking the field's condition. @default false
     */
    skipConditionChecks?: boolean;
    /**
     * Whether to skip validating the field. @default false
     */
    skipValidation?: boolean;
    state?: FormStateWithoutComponents;
};
/**
 * Flattens the fields schema and fields data
 */
export declare const iterateFields: ({ id, addErrorPathToParent: addErrorPathToParentArg, anyParentLocalized, blockData, clientFieldSchemaMap, collectionSlug, data, fields, fieldSchemaMap, filter, forceFullValue, fullData, includeSchema, mockRSCs, omitParents, operation, parentIndexPath, parentPassesCondition, parentPath, parentSchemaPath, permissions, preferences, previousFormState, readOnly, renderAllFields, renderFieldFn: renderFieldFn, req, select, selectMode, skipConditionChecks, skipValidation, state, }: Args) => Promise<void>;
export {};
//# sourceMappingURL=iterateFields.d.ts.map