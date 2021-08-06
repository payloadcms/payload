/* eslint-disable no-use-before-define */
import { CSSProperties } from 'react';
import { Editor } from 'slate';
import { PayloadRequest } from '../../express/types';
import { Document } from '../../types';
import { ConditionalDateProps } from '../../admin/components/elements/DatePicker/types';

export type FieldHook = (args: {
  value?: unknown,
  originalDoc?: Document,
  data?: {
    [key: string]: unknown
  },
  operation?: 'create' | 'read' | 'update' | 'delete',
  req: PayloadRequest
}) => Promise<unknown> | unknown;

export type FieldAccess = (args: {
  req: PayloadRequest
  id?: string
  data: Record<string, unknown>
  siblingData: Record<string, unknown>
}) => Promise<boolean> | boolean;

export type Condition = (data: Record<string, unknown>, siblingData: Record<string, unknown>) => boolean;

type Admin = {
  position?: string;
  width?: string;
  style?: CSSProperties;
  readOnly?: boolean;
  disabled?: boolean;
  condition?: Condition;
  description?: Description;
  components?: {
    Filter?: React.ComponentType;
    Cell?: React.ComponentType;
    Field?: React.ComponentType;
  }
  hidden?: boolean
}

export type Description = string | ((value: Record<string, unknown>) => string);

export type Labels = {
  singular: string;
  plural: string;
};

export type Validate = (value: unknown, options?: any) => string | true | Promise<string | true>;

export type OptionObject = {
  label: string
  value: string
}

export type Option = OptionObject | string

export interface FieldBase {
  name?: string;
  label?: string | false;
  required?: boolean;
  unique?: boolean;
  index?: boolean;
  defaultValue?: any;
  hidden?: boolean;
  saveToJWT?: boolean
  localized?: boolean;
  validate?: Validate;
  hooks?: {
    beforeValidate?: FieldHook[];
    beforeChange?: FieldHook[];
    afterChange?: FieldHook[];
    afterRead?: FieldHook[];
  }
  admin?: Admin;
  access?: {
    create?: FieldAccess;
    read?: FieldAccess;
    update?: FieldAccess;
  };
}

export type NumberField = FieldBase & {
  type: 'number';
  admin?: Admin & {
    autoComplete?: string
    placeholder?: string
    step?: number
  }
  min?: number
  max?: number
}

export type TextField = FieldBase & {
  type: 'text';
  maxLength?: number
  minLength?: number
  admin?: Admin & {
    placeholder?: string
    autoComplete?: string
  }
}

export type EmailField = FieldBase & {
  type: 'email';
  admin?: Admin & {
    placeholder?: string
    autoComplete?: string
  }
}

export type TextareaField = FieldBase & {
  type: 'textarea';
  maxLength?: number
  minLength?: number
  admin?: Admin & {
    placeholder?: string
    rows?: number
  }
}

export type CheckboxField = FieldBase & {
  type: 'checkbox';
}

export type DateField = FieldBase & {
  type: 'date';
  admin?: Admin & {
    placeholder?: string
    date?: ConditionalDateProps
  }
}

export type GroupField = FieldBase & {
  type: 'group';
  fields: Field[];
  admin?: Admin & {
    hideGutter?: boolean
  }
}

export type RowAdmin = Omit<Admin, 'description'> & {
  readOnly?: false;
  hidden?: false;
};

export type RowField = Omit<FieldBase, 'admin'> & {
  admin?: RowAdmin;
  type: 'row';
  fields: Field[];
}

export type UploadField = FieldBase & {
  type: 'upload';
  relationTo: string;
  maxDepth?: number;
}

type CodeAdmin = Admin & {
  language?: string;
}

export type CodeField = Omit<FieldBase, 'admin'> & {
  admin?: CodeAdmin
  minLength?: number
  maxLength?: number
  type: 'code';
}

export type SelectField = FieldBase & {
  type: 'select';
  options: Option[];
  hasMany?: boolean;
}

export type RelationshipField = FieldBase & {
  type: 'relationship';
  relationTo: string | string[];
  hasMany?: boolean;
  maxDepth?: number;
}

type RichTextPlugin = (editor: Editor) => Editor;

export type RichTextCustomElement = {
  name: string
  Button: React.ComponentType
  Element: React.ComponentType
  plugins?: RichTextPlugin[]
}

export type RichTextCustomLeaf = {
  name: string
  Button: React.ComponentType
  Leaf: React.ComponentType
  plugins?: RichTextPlugin[]
}

export type RichTextElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'blockquote' | 'ul' | 'ol' | 'link' | 'relationship' | RichTextCustomElement;
export type RichTextLeaf = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | RichTextCustomLeaf;

export type RichTextField = FieldBase & {
  type: 'richText';
  admin?: Admin & {
    placeholder?: string
    elements?: RichTextElement[];
    leaves?: RichTextLeaf[];
    hideGutter?: boolean;
  }
}

export type ArrayField = FieldBase & {
  type: 'array';
  minRows?: number;
  maxRows?: number;
  labels?: Labels;
  fields?: Field[];
}

export type RadioField = FieldBase & {
  type: 'radio';
  options: Option[]
  admin?: Admin & {
    layout?: 'horizontal' | 'vertical'
  }
}

export type Block = {
  slug: string;
  labels?: Labels;
  fields: Field[];
  imageURL?: string;
  imageAltText?: string;
}

export type BlockField = FieldBase & {
  type: 'blocks';
  minRows?: number;
  maxRows?: number;
  blocks?: Block[];
  defaultValue?: unknown
  labels?: Labels
}

export type Field =
  TextField
  | NumberField
  | EmailField
  | TextareaField
  | CheckboxField
  | DateField
  | BlockField
  | GroupField
  | RadioField
  | RelationshipField
  | ArrayField
  | RichTextField
  | SelectField
  | UploadField
  | CodeField
  | RowField;

export type FieldWithPath = Field & {
  path?: string
}

export type FieldWithSubFields =
  GroupField
  | ArrayField
  | RowField;

export type FieldWithMany =
  SelectField
  | RelationshipField

export type FieldWithMaxDepth =
  UploadField
  | RelationshipField

export function fieldHasSubFields(field: Field): field is FieldWithSubFields {
  return (field.type === 'group' || field.type === 'array' || field.type === 'row');
}

export function fieldIsArrayType(field: Field): field is ArrayField {
  return field.type === 'array';
}

export function fieldIsBlockType(field: Field): field is BlockField {
  return field.type === 'blocks';
}

export function optionIsObject(option: Option): option is OptionObject {
  return typeof option === 'object';
}

export function optionsAreObjects(options: Option[]): options is OptionObject[] {
  return Array.isArray(options) && typeof options?.[0] === 'object';
}

export function optionIsValue(option: Option): option is string {
  return typeof option === 'string';
}

export function fieldSupportsMany(field: Field): field is FieldWithMany {
  return field.type === 'select' || field.type === 'relationship';
}

export function fieldHasMaxDepth(field: Field): field is FieldWithMaxDepth {
  return (field.type === 'upload' || field.type === 'relationship') && typeof field.maxDepth === 'number';
}

export type HookName = 'beforeChange' | 'beforeValidate' | 'afterChange' | 'afterRead';
