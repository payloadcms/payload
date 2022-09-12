/* eslint-disable no-use-before-define */
import { CSSProperties } from 'react';
import { Editor } from 'slate';
import { Operation, Where } from '../../types';
import { TypeWithID } from '../../collections/config/types';
import { PayloadRequest } from '../../express/types';
import { ConditionalDateProps } from '../../admin/components/elements/DatePicker/types';
import { Description } from '../../admin/components/forms/FieldDescription/types';
import { User } from '../../auth';
import { Payload } from '../..';

export type FieldHookArgs<T extends TypeWithID = any, P = any, S = any> = {
  data?: Partial<T>,
  findMany?: boolean
  originalDoc?: T,
  operation?: 'create' | 'read' | 'update' | 'delete',
  req: PayloadRequest
  siblingData: Partial<S>
  value?: P,
}

export type FieldHook<T extends TypeWithID = any, P = any, S = any> = (args: FieldHookArgs<T, P, S>) => Promise<P> | P;

export type FieldAccess<T extends TypeWithID = any, P = any> = (args: {
  req: PayloadRequest
  id?: string | number
  data?: Partial<T>
  siblingData?: Partial<P>
  doc?: T
}) => Promise<boolean> | boolean;

export type Condition<T extends TypeWithID = any, P = any> = (data: Partial<T>, siblingData: Partial<P>) => boolean;

export type FilterOptionsProps = {
  id: string | number,
  user: Partial<User>,
  data: unknown,
  siblingData: unknown,
  relationTo: string | string[],
}

export type FilterOptions = Where | ((options: FilterOptionsProps) => Where);

type Admin = {
  position?: 'sidebar';
  width?: string;
  style?: CSSProperties;
  className?: string;
  readOnly?: boolean;
  disabled?: boolean;
  condition?: Condition;
  description?: Description;
  components?: {
    Filter?: React.ComponentType<any>;
    Cell?: React.ComponentType<any>;
    Field?: React.ComponentType<any>;
  }
  hidden?: boolean
}

export type Labels = {
  singular: string;
  plural: string;
};

export type ValidateOptions<T, S, F> = {
  data: Partial<T>
  siblingData: Partial<S>
  id?: string | number
  user?: Partial<User>
  operation?: Operation
  payload?: Payload
} & F;

export type Validate<T = any, S = any, F = any> = (value?: T, options?: ValidateOptions<F, S, Partial<F>>) => string | true | Promise<string | true>;

export type OptionObject = {
  label: string
  value: string
}

export type Option = OptionObject | string

export interface FieldBase {
  name: string;
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

export type RowAdmin = Omit<Admin, 'description'>;

export type RowField = Omit<FieldBase, 'admin' | 'name'> & {
  admin?: RowAdmin;
  type: 'row';
  fields: Field[];
}

export type CollapsibleField = Omit<FieldBase, 'name'> & {
  type: 'collapsible';
  label: string
  fields: Field[];
}

export type TabsAdmin = Omit<Admin, 'description'>;

type TabBase = {
  fields: Field[]
  description?: Description
}

export type NamedTab = TabBase & FieldBase

export type UnnamedTab = TabBase & Omit<FieldBase, 'name'> & {
  label: string
  localized?: never
}

export type Tab = NamedTab | UnnamedTab

export type TabsField = Omit<FieldBase, 'admin' | 'name' | 'localized'> & {
  type: 'tabs';
  tabs: Tab[]
  admin?: TabsAdmin
}

export type TabAsField = Tab & {
  type: 'tab'
};

export type UIField = {
  name: string
  label?: string
  admin: {
    position?: string
    width?: string
    condition?: Condition
    components?: {
      Filter?: React.ComponentType<any>;
      Cell?: React.ComponentType<any>;
      Field: React.ComponentType<any>;
    }
  }
  type: 'ui';
}

export type UploadField = FieldBase & {
  type: 'upload'
  relationTo: string
  maxDepth?: number
  filterOptions?: FilterOptions;
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
  type: 'select'
  options: Option[]
  hasMany?: boolean
  admin?: Admin & {
    isClearable?: boolean;
    isSortable?: boolean;
  }
}

export type RelationshipField = FieldBase & {
  type: 'relationship';
  relationTo: string | string[];
  hasMany?: boolean;
  maxDepth?: number;
  filterOptions?: FilterOptions;
  admin?: Admin & {
    isSortable?: boolean;
  }
}

export type ValueWithRelation = {
  relationTo: string
  value: string | number
}

export function valueIsValueWithRelation(value: unknown): value is ValueWithRelation {
  return typeof value === 'object' && 'relationTo' in value && 'value' in value;
}

export type RelationshipValue = (string | number)
  | (string | number)[]
  | ValueWithRelation
  | ValueWithRelation[]

type RichTextPlugin = (editor: Editor) => Editor;

export type RichTextCustomElement = {
  name: string
  Button: React.ComponentType<any>
  Element: React.ComponentType<any>
  plugins?: RichTextPlugin[]
}

export type RichTextCustomLeaf = {
  name: string
  Button: React.ComponentType<any>
  Leaf: React.ComponentType<any>
  plugins?: RichTextPlugin[]
}

export type RichTextElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'blockquote' | 'ul' | 'ol' | 'link' | 'relationship' | 'upload' | 'indent' | RichTextCustomElement;
export type RichTextLeaf = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | RichTextCustomLeaf;

export type RichTextField = FieldBase & {
  type: 'richText';
  admin?: Admin & {
    placeholder?: string
    elements?: RichTextElement[];
    leaves?: RichTextLeaf[];
    hideGutter?: boolean
    upload?: {
      collections: {
        [collection: string]: {
          fields: Field[];
        }
      }
    }
    link?: {
      fields?: Field[];
    }
  }
}

export type ArrayField = FieldBase & {
  type: 'array';
  minRows?: number;
  maxRows?: number;
  labels?: Labels;
  fields: Field[];
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
  blocks: Block[];
  defaultValue?: unknown
  labels?: Labels
}

export type PointField = FieldBase & {
  type: 'point',
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
  | PointField
  | RowField
  | CollapsibleField
  | TabsField
  | UIField;

export type FieldAffectingData =
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
  | PointField

export type NonPresentationalField =
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
  | PointField
  | RowField
  | TabsField
  | CollapsibleField;

export type FieldWithPath = Field & {
  path?: string
}

export type FieldWithSubFields =
  GroupField
  | ArrayField
  | RowField
  | CollapsibleField;

export type FieldPresentationalOnly =
  UIField;

export type FieldWithMany =
  SelectField
  | RelationshipField

export type FieldWithMaxDepth =
  UploadField
  | RelationshipField

export function fieldHasSubFields(field: Field): field is FieldWithSubFields {
  return (field.type === 'group' || field.type === 'array' || field.type === 'row' || field.type === 'collapsible');
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

export function fieldIsPresentationalOnly(field: Field | TabAsField): field is UIField {
  return field.type === 'ui';
}

export function fieldAffectsData(field: Field | TabAsField): field is FieldAffectingData {
  return 'name' in field && !fieldIsPresentationalOnly(field);
}

export function tabHasName(tab: Tab): tab is NamedTab {
  return 'name' in tab;
}

export function fieldIsLocalized(field: Field | Tab): boolean {
  return 'localized' in field && field.localized;
}

export type HookName = 'beforeRead' | 'beforeChange' | 'beforeValidate' | 'afterChange' | 'afterRead';
