/// <reference types="react" />
import { ArrayField, BlockField, CheckboxField, CodeField, DateField, EmailField, JSONField, NumberField, PointField, RadioField, RelationshipField, RichTextField, SelectField, TextareaField, TextField, UploadField, Validate } from './config/types';
export declare const number: Validate<unknown, unknown, NumberField>;
export declare const text: Validate<unknown, unknown, TextField>;
export declare const password: Validate<unknown, unknown, TextField>;
export declare const email: Validate<unknown, unknown, EmailField>;
export declare const textarea: Validate<unknown, unknown, TextareaField>;
export declare const code: Validate<unknown, unknown, CodeField>;
export declare const json: Validate<unknown, unknown, JSONField & {
    jsonError?: string;
}>;
export declare const richText: Validate<unknown, unknown, RichTextField>;
export declare const checkbox: Validate<unknown, unknown, CheckboxField>;
export declare const date: Validate<unknown, unknown, DateField>;
export declare const upload: Validate<unknown, unknown, UploadField>;
export declare const relationship: Validate<unknown, unknown, RelationshipField>;
export declare const array: Validate<unknown, unknown, ArrayField>;
export declare const select: Validate<unknown, unknown, SelectField>;
export declare const radio: Validate<unknown, unknown, RadioField>;
export declare const blocks: Validate<unknown, unknown, BlockField>;
export declare const point: Validate<unknown, unknown, PointField>;
declare const _default: {
    number: Validate<unknown, unknown, NumberField, any>;
    text: Validate<unknown, unknown, TextField, any>;
    password: Validate<unknown, unknown, TextField, any>;
    email: Validate<unknown, unknown, EmailField, any>;
    textarea: Validate<unknown, unknown, TextareaField, any>;
    code: Validate<unknown, unknown, CodeField, any>;
    richText: Validate<unknown, unknown, RichTextField, any>;
    checkbox: Validate<unknown, unknown, CheckboxField, any>;
    date: Validate<unknown, unknown, DateField, any>;
    upload: Validate<unknown, unknown, UploadField, any>;
    relationship: Validate<unknown, unknown, RelationshipField, any>;
    array: Validate<unknown, unknown, ArrayField, any>;
    select: Validate<unknown, unknown, SelectField, any>;
    radio: Validate<unknown, unknown, RadioField, any>;
    blocks: Validate<unknown, unknown, BlockField, any>;
    point: Validate<unknown, unknown, PointField, any>;
    json: Validate<unknown, unknown, Omit<import("./config/types").FieldBase, "admin"> & {
        admin?: {
            position?: "sidebar";
            width?: string;
            style?: import("react").CSSProperties;
            className?: string;
            readOnly?: boolean;
            disabled?: boolean;
            condition?: import("./config/types").Condition<any, any>;
            description?: import("../admin/components/forms/FieldDescription/types").Description;
            components?: {
                Filter?: import("react").ComponentType<any>;
                Cell?: import("react").ComponentType<any>;
                Field?: import("react").ComponentType<any>;
            };
            disableBulkEdit?: boolean;
            hidden?: boolean;
        } & {
            editorOptions?: monaco.editor.IStandaloneEditorConstructionOptions;
        };
        type: "json";
    } & {
        jsonError?: string;
    }, any>;
};
export default _default;
