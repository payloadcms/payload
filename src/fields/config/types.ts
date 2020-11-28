/* eslint-disable no-use-before-define */
import { CSSProperties } from 'react';
import { PayloadRequest } from '../../express/types/payloadRequest';
import { Access } from '../../config/types';

// TODO: add generic type and use mongoose types for originalDoc & data
export type FieldHook = (args: {
  value?: any,
  originalDoc?: any,
  data?: any,
  operation?: 'create' | 'update',
  req?: PayloadRequest
}) => Promise<any> | any;

type FieldBase = {
  name: string;
  label: string;
  slug?: string;
  required?: boolean;
  unique?: boolean;
  index?: boolean;
  defaultValue?: any;
  hidden?: boolean;
  localized?: boolean;
  maxLength?: number;
  height?: number;
  validate?: (value: any, field: Field) => any;
  // eslint-disable-next-line no-use-before-define
  hooks?: {
    beforeValidate?: FieldHook[];
    beforeChange?: FieldHook[];
    afterChange?: FieldHook[];
    afterRead?: FieldHook[];
  }
  admin?: {
    position?: 'sidebar';
    width?: string;
    style?: CSSProperties;
    readOnly?: boolean;
    disabled?: boolean;
    condition?: (...args: any[]) => any | void;
    components?: { [key: string]: React.ComponentType };
  };
  access?: {
    create?: Access;
    read?: Access;
    update?: Access;
    delete?: Access;
    admin?: Access;
    unlock?: Access;
  };
}

export type StandardField = FieldBase & {
  type: string;
  fields?: Field[];
}

export type NumberField = StandardField & { type: 'number'; };
export type TextField = StandardField & { type: 'text'; };
export type EmailField = StandardField & { type: 'email'; };
export type TextareaField = StandardField & { type: 'textarea'; };
export type CodeField = StandardField & { type: 'code'; };
export type CheckboxField = StandardField & { type: 'checkbox'; };
export type DateField = StandardField & { type: 'date'; };
export type GroupField = StandardField & { type: 'group'; };
export type RowField = StandardField & { type: 'row'; };

export type UploadField = FieldBase & {
  type: 'upload';
  relationTo: string;
}

export type SelectField = FieldBase & {
  type: 'select';
  options: {
    value: string;
    label: string;
  }[];
  hasMany?: boolean;
}

export type SelectManyField = SelectField & {
  hasMany: true;
}

export type RelationshipSingleField = FieldBase & {
  type: 'relationship';
  relationTo: string;
  hasMany?: false;
}

export type RelationshipManyField = FieldBase & {
  type: 'relationship';
  relationTo: string[];
  hasMany: true;
}

export type RelationshipField = RelationshipSingleField | RelationshipManyField;

type RichTextElements = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'blockquote' | 'ul' | 'ol' | 'link';
type RichTextLeaves = 'bold' | 'italic' | 'underline' | 'strikethrough';
export type RichTextField = FieldBase & {
  type: 'richText';
  admin?: {
    elements?: RichTextElements[];
    leaves?: RichTextLeaves[];
  }
}

export type ArrayField = FieldBase & {
  type: 'array';
  minRows?: number;
  maxRows?: number;
  fields?: Field[];
}

export type RadioField = FieldBase & {
  type: 'radio';
  options: {
    value: string;
    label: string;
  }[];
  hasMany?: boolean;
}

export type Block = {
  slug: string,
  labels: {
    singular: string;
    plural: string;
  };
  fields: Field[],
}

export type BlockField = FieldBase & {
  type: 'blocks';
  minRows?: number;
  maxRows?: number;
  blocks?: Field[];
};

export type Field =
  | StandardField
  | BlockField
  | RadioField
  | RelationshipField
  | ArrayField
  | RichTextField
  | SelectField
  | SelectManyField
  | UploadField;
