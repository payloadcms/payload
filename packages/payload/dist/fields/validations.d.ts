import type { ArrayField, BlocksField, CheckboxField, CodeField, DateField, EmailField, JSONField, NumberField, PointField, RadioField, RelationshipField, RelationshipValue, RelationshipValueMany, RelationshipValueSingle, RichTextField, SelectField, TextareaField, TextField, UploadField, Validate } from './config/types.js';
export type TextFieldValidation = Validate<string, unknown, unknown, TextField>;
export type TextFieldManyValidation = Validate<string[], unknown, unknown, TextField>;
export type TextFieldSingleValidation = Validate<string, unknown, unknown, TextField>;
export declare const text: TextFieldValidation;
export type PasswordFieldValidation = Validate<string, unknown, unknown, TextField>;
export declare const password: PasswordFieldValidation;
export type ConfirmPasswordFieldValidation = Validate<string, unknown, {
    password: string;
}, TextField>;
export declare const confirmPassword: ConfirmPasswordFieldValidation;
export type EmailFieldValidation = Validate<string, unknown, {
    username?: string;
}, EmailField>;
export declare const email: EmailFieldValidation;
export type UsernameFieldValidation = Validate<string, unknown, {
    email?: string;
}, TextField>;
export declare const username: UsernameFieldValidation;
export type TextareaFieldValidation = Validate<string, unknown, unknown, TextareaField>;
export declare const textarea: TextareaFieldValidation;
export type CodeFieldValidation = Validate<string, unknown, unknown, CodeField>;
export declare const code: CodeFieldValidation;
export type JSONFieldValidation = Validate<string, unknown, unknown, {
    jsonError?: string;
} & JSONField>;
export declare const json: JSONFieldValidation;
export type CheckboxFieldValidation = Validate<boolean, unknown, unknown, CheckboxField>;
export declare const checkbox: CheckboxFieldValidation;
export type DateFieldValidation = Validate<Date, unknown, unknown, DateField>;
export declare const date: DateFieldValidation;
export type RichTextFieldValidation = Validate<object, unknown, unknown, RichTextField>;
export declare const richText: RichTextFieldValidation;
export type NumberFieldValidation = Validate<number | number[], unknown, unknown, NumberField>;
export type NumberFieldManyValidation = Validate<number[], unknown, unknown, NumberField>;
export type NumberFieldSingleValidation = Validate<number, unknown, unknown, NumberField>;
export declare const number: NumberFieldValidation;
export type ArrayFieldValidation = Validate<unknown[], unknown, unknown, ArrayField>;
export declare const array: ArrayFieldValidation;
export type BlocksFieldValidation = Validate<unknown, unknown, unknown, BlocksField>;
/**
 * This function validates the blocks in a blocks field against the provided filterOptions.
 * It will return a list of all block slugs found in the value, the allowed block slugs (if any),
 * and a list of invalid block slugs that are used despite being disallowed.
 *
 * @internal - this may break or be removed at any time
 */
export declare function validateBlocksFilterOptions({ id, data, filterOptions, req, siblingData, value, }: {
    value: Parameters<BlocksFieldValidation>[0];
} & Pick<Parameters<BlocksFieldValidation>[1], 'data' | 'filterOptions' | 'id' | 'req' | 'siblingData'>): Promise<{
    /**
     * All block slugs found in the value of the blocks field
     */
    allBlockSlugs: string[];
    /**
     * All block slugs that are allowed. If undefined, all blocks are allowed.
     */
    allowedBlockSlugs: string[] | undefined;
    /**
     * A list of block slugs that are used despite being disallowed. If undefined, field passed validation.
     */
    invalidBlockSlugs: string[] | undefined;
}>;
export declare const blocks: BlocksFieldValidation;
export type UploadFieldValidation = Validate<unknown, unknown, unknown, UploadField>;
export type UploadFieldManyValidation = Validate<unknown[], unknown, unknown, UploadField>;
export type UploadFieldSingleValidation = Validate<unknown, unknown, unknown, UploadField>;
export declare const upload: UploadFieldValidation;
export type RelationshipFieldValidation = Validate<RelationshipValue, unknown, unknown, RelationshipField>;
export type RelationshipFieldManyValidation = Validate<RelationshipValueMany, unknown, unknown, RelationshipField>;
export type RelationshipFieldSingleValidation = Validate<RelationshipValueSingle, unknown, unknown, RelationshipField>;
export declare const relationship: RelationshipFieldValidation;
export type SelectFieldValidation = Validate<string | string[], unknown, unknown, SelectField>;
export type SelectFieldManyValidation = Validate<string[], unknown, unknown, SelectField>;
export type SelectFieldSingleValidation = Validate<string, unknown, unknown, SelectField>;
export declare const select: SelectFieldValidation;
export type RadioFieldValidation = Validate<unknown, unknown, unknown, RadioField>;
export declare const radio: RadioFieldValidation;
export type PointFieldValidation = Validate<[
    number | string,
    number | string
], unknown, unknown, PointField>;
export declare const point: PointFieldValidation;
/**
 * Built-in field validations used by Payload
 *
 * These can be re-used in custom validations
 */
export declare const validations: {
    array: ArrayFieldValidation;
    blocks: BlocksFieldValidation;
    checkbox: CheckboxFieldValidation;
    code: CodeFieldValidation;
    confirmPassword: ConfirmPasswordFieldValidation;
    date: DateFieldValidation;
    email: EmailFieldValidation;
    json: JSONFieldValidation;
    number: NumberFieldValidation;
    password: PasswordFieldValidation;
    point: PointFieldValidation;
    radio: RadioFieldValidation;
    relationship: RelationshipFieldValidation;
    richText: RichTextFieldValidation;
    select: SelectFieldValidation;
    text: TextFieldValidation;
    textarea: TextareaFieldValidation;
    upload: UploadFieldValidation;
};
//# sourceMappingURL=validations.d.ts.map