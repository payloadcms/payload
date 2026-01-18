import type { BuildFormStateArgs, ClientFieldSchemaMap, Data, DocumentPreferences, Field, FieldSchemaMap, FormState, FormStateWithoutComponents, PayloadRequest, SanitizedFieldsPermissions, SelectMode, SelectType, TabAsField } from 'payload';
import type { RenderFieldMethod } from './types.js';
export type AddFieldStatePromiseArgs = {
    addErrorPathToParent: (fieldPath: string) => void;
    /**
     * if all parents are localized, then the field is localized
     */
    anyParentLocalized?: boolean;
    /**
     * Data of the nearest parent block, or undefined
     */
    blockData: Data | undefined;
    clientFieldSchemaMap?: ClientFieldSchemaMap;
    collectionSlug?: string;
    data: Data;
    field: Field | TabAsField;
    fieldIndex: number;
    fieldSchemaMap: FieldSchemaMap;
    /**
     * You can use this to filter down to only `localized` fields that require translation (type: text, textarea, etc.). Another plugin might want to look for only `point` type fields to do some GIS function. With the filter function you can go in like a surgeon.
     */
    filter?: (args: AddFieldStatePromiseArgs) => boolean;
    /**
     * Force the value of fields like arrays or blocks to be the full value instead of the length @default false
     */
    forceFullValue?: boolean;
    fullData: Data;
    id: number | string;
    /**
     * Whether the field schema should be included in the state
     */
    includeSchema?: boolean;
    indexPath: string;
    mockRSCs?: BuildFormStateArgs['mockRSCs'];
    /**
     * Whether to omit parent fields in the state. @default false
     */
    omitParents?: boolean;
    operation: 'create' | 'update';
    parentIndexPath: string;
    parentPath: string;
    parentPermissions: SanitizedFieldsPermissions;
    parentSchemaPath: string;
    passesCondition: boolean;
    path: string;
    preferences: DocumentPreferences;
    previousFormState: FormState;
    readOnly?: boolean;
    renderAllFields: boolean;
    renderFieldFn: RenderFieldMethod;
    /**
     * Req is used for validation and defaultValue calculation. If you don't need validation,
     * just create your own req and pass in the locale and the user
     */
    req: PayloadRequest;
    schemaPath: string;
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
    state: FormStateWithoutComponents;
};
/**
 * Flattens the fields schema and fields data.
 * The output is the field path (e.g. array.0.name) mapped to a FormField object.
 */
export declare const addFieldStatePromise: (args: AddFieldStatePromiseArgs) => Promise<void>;
//# sourceMappingURL=addFieldStatePromise.d.ts.map