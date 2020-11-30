/* eslint-disable no-use-before-define */
import { CSSProperties } from 'react';
import { PayloadRequest } from '../../express/types/payloadRequest';
import { Access } from '../../config/types';
import { Document } from '../../types';

export type FieldHook = (args: {
  value?: unknown,
  originalDoc?: Document,
  data?: {
    [key: string]: unknown
  },
  operation?: 'create' | 'update',
  req: PayloadRequest
}) => Promise<unknown> | unknown;

type Admin = {
  position?: string;
  width?: string;
  style?: CSSProperties;
  readOnly?: boolean;
  disabled?: boolean;
  condition?: (...args: any[]) => any | void;
  components?: { [key: string]: React.ComponentType };
  hidden?: boolean
}

type Labels = {
  singular: string;
  plural: string;
};

interface FieldBase {
  name?: string;
  label?: string;
  slug?: string;
  required?: boolean;
  unique?: boolean;
  index?: boolean;
  defaultValue?: any;
  hidden?: boolean;
  saveToJWT?: boolean
  localized?: boolean;
  validate?: (value: any, field: Field) => any;
  hooks?: {
    beforeValidate?: FieldHook[];
    beforeChange?: FieldHook[];
    afterChange?: FieldHook[];
    afterRead?: FieldHook[];
  }
  admin?: Admin;
  access?: {
    create?: Access;
    read?: Access;
    update?: Access;
    delete?: Access;
    unlock?: Access;
  };
}

export type NumberField = FieldBase & {
  type: 'number';
  min?: number
  max?: number
}

export type TextField = FieldBase & {
  type: 'text';
  maxLength?: number
  minLength?: number
}

export type EmailField = FieldBase & {
  type: 'email';
}

export type TextareaField = FieldBase & {
  type: 'textarea';
  maxLength?: number
  minLength?: number
}

export type CheckboxField = FieldBase & {
  type: 'checkbox';
}

export type DateField = FieldBase & {
  type: 'date';
}

export type GroupField = FieldBase & {
  type: 'group';
  fields: Field[];
}

export type RowField = FieldBase & {
  type: 'row';
  fields: Field[];
}

export type UploadField = FieldBase & {
  type: 'upload';
  relationTo: string;
}

type CodeAdmin = Admin & {
  language?: string;
}

export type CodeField = Omit<FieldBase, 'admin'> & {
  admin?: CodeAdmin
  type: 'code';
}

export type SelectField = FieldBase & {
  type: 'select';
  options: {
    value: string;
    label: string;
  }[] | string[];
  hasMany?: boolean;
}

export type RelationshipField = FieldBase & {
  type: 'relationship';
  relationTo: string | string[];
  hasMany?: boolean;
}

type RichTextElements = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'blockquote' | 'ul' | 'ol' | 'link';
type RichTextLeaves = 'bold' | 'italic' | 'underline' | 'strikethrough';

type RichTextAdmin = Admin & {
  elements?: RichTextElements[];
  leaves?: RichTextLeaves[];
}

export type RichTextField = Omit<FieldBase, 'admin'> & {
  type: 'richText';
  admin?: RichTextAdmin
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
  options: {
    value: string;
    label: string;
  }[] | string[];
  hasMany?: boolean;
}

export type Block = {
  slug: string,
  labels: Labels
  fields: Field[],
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
