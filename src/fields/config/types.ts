/* eslint-disable no-use-before-define */
import { CSSProperties } from 'react';
import { Editor } from 'slate';
import type { TFunction, i18n as Ii18n } from 'i18next';
import type { EditorProps } from '@monaco-editor/react';
import type { Config as GeneratedTypes } from 'payload/generated-types';
import { Operation, Where } from '../../types';
import { SanitizedConfig } from '../../config/types';
import { CollectionSlug, TypeWithID } from '../../collections/config/types';
import { PayloadRequest } from '../../express/types';
import { ConditionalDateProps } from '../../admin/components/elements/DatePicker/types';
import { Description } from '../../admin/components/forms/FieldDescription/types';
import { User } from '../../auth';
import { Payload } from '../../payload';
import { RowLabel } from '../../admin/components/forms/RowLabel/types';

type StringKeys<T> = Extract<keyof T, string>;
export type Fields<TSlug extends CollectionSlug> = GeneratedTypes['collections'][TSlug];
export type FieldName<TSlug extends CollectionSlug> = StringKeys<Fields<TSlug>>;


export type FieldHookArgs<TCollection extends TypeWithID = any, TField = any, TSibling = any> = {
  /** The data passed to update the document within create and update operations, and the full document itself in the afterRead hook. */
  data?: Partial<TCollection>,
  /** Boolean to denote if this hook is running against finding one, or finding many within the afterRead hook. */
  findMany?: boolean
  /** The full original document in `update` operations. In the `afterChange` hook, this is the resulting document of the operation. */
  originalDoc?: TCollection,
  /** The document before changes were applied, only in `afterChange` hooks. */
  previousDoc?: TCollection,
  /** The sibling data from the previous document in `afterChange` hook. */
  previousSiblingDoc?: TCollection,
  /** A string relating to which operation the field type is currently executing within. Useful within beforeValidate, beforeChange, and afterChange hooks to differentiate between create and update operations. */
  operation?: 'create' | 'read' | 'update' | 'delete',
  /** The Express request object. It is mocked for Local API operations. */
  req: PayloadRequest
  /** The sibling data passed to a field that the hook is running against. */
  siblingData: Partial<TSibling>
  /** The value of the field. */
  value?: TField,
  previousValue?: TField,
}

export type FieldHook<TCollection extends TypeWithID = any, TField = any, TSibling = any> = (args: FieldHookArgs<TCollection, TField, TSibling>) => Promise<TField> | TField;

export type FieldAccess<TCollection extends TypeWithID = any, P = any, U = any> = (args: {
  req: PayloadRequest<U>
  id?: string | number
  data?: Partial<TCollection>
  siblingData?: Partial<P>
  doc?: TCollection
}) => Promise<boolean> | boolean;

export type Condition<T extends TypeWithID = any, P = any> = (data: Partial<T>, siblingData: Partial<P>, { user }: { user: User }) => boolean;

export type FilterOptionsProps<T = any> = {
  id: string | number,
  user: Partial<User>,
  data: T,
  siblingData: unknown,
  relationTo: string,
}

export type FilterOptions<T = any> = Where | ((options: FilterOptionsProps<T>) => Where);

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
  disableBulkEdit?: boolean
  hidden?: boolean
}

export type Labels = {
  singular: Record<string, string> | string;
  plural: Record<string, string> | string;
};

export type ValidateOptions<TData, TSiblingData, TFieldConfig> = {
  data: Partial<TData>
  siblingData: Partial<TSiblingData>
  id?: string | number
  user?: Partial<User>
  operation?: Operation
  payload?: Payload
  t: TFunction
} & TFieldConfig;

export type Validate<TValue = any, TData = any, TSiblingData = any, TFieldConfig = any> = (value: TValue, options: ValidateOptions<TData, TSiblingData, TFieldConfig>) => string | true | Promise<string | true>;

export type OptionObject = {
  label: Record<string, string> | string
  value: string
}

export type Option = OptionObject | string

export interface FieldBaseType<TSlug extends CollectionSlug, TFieldName extends FieldName<TSlug>> {
  name: TFieldName;
  label?: Record<string, string> | string | false;
  required?: boolean;
  unique?: boolean;
  index?: boolean;
  defaultValue?: Fields<TSlug>[TFieldName];
  hidden?: boolean;
  saveToJWT?: boolean
  localized?: boolean;
  validate?: Validate;
  hooks?: {
    beforeValidate?: FieldHook<Fields<TSlug>, Fields<TSlug>[TFieldName]>[];
    beforeChange?: FieldHook<Fields<TSlug>, Fields<TSlug>[TFieldName]>[];
    afterChange?: FieldHook<Fields<TSlug>, Fields<TSlug>[TFieldName]>[];
    afterRead?: FieldHook<Fields<TSlug>, Fields<TSlug>[TFieldName]>[]
  }
  admin?: Admin;
  access?: {
    create?: FieldAccess<Fields<TSlug>>;
    read?: FieldAccess<Fields<TSlug>>;
    update?: FieldAccess<Fields<TSlug>>;
  };
  /** Extension  point to add your custom data. */
  custom?: Record<string, any>;
}

type FieldBases<TSlug extends CollectionSlug = any> = {
  [K in FieldName<TSlug>]: FieldBaseType<TSlug, K>;
}

export type FieldBase<TSlug extends CollectionSlug = any> = FieldBases<TSlug>[FieldName<TSlug>];

export type NumberField<TSlug extends CollectionSlug = any> = FieldBase<TSlug> & {
  type: 'number';
  admin?: Admin & {
    autoComplete?: string
    placeholder?: Record<string, string> | string
    step?: number
  }
  min?: number
  max?: number
}

export type TextField<TSlug extends CollectionSlug = any> = FieldBase<TSlug> & {

  type: 'text';
  maxLength?: number
  minLength?: number
  admin?: Admin & {
    placeholder?: Record<string, string> | string
    autoComplete?: string
  }
}

export type EmailField<TSlug extends CollectionSlug = any> = FieldBase<TSlug> & {
  type: 'email';
  admin?: Admin & {
    placeholder?: Record<string, string> | string
    autoComplete?: string
  }
}

export type TextareaField<TSlug extends CollectionSlug = any> = FieldBase<TSlug> & {
  type: 'textarea';
  maxLength?: number
  minLength?: number
  admin?: Admin & {
    placeholder?: Record<string, string> | string
    rows?: number
  }
}

export type CheckboxField<TSlug extends CollectionSlug = any> = FieldBase<TSlug> & {
  type: 'checkbox';
}

export type DateField<TSlug extends CollectionSlug = any> = FieldBase<TSlug> & {
  type: 'date';
  admin?: Admin & {
    placeholder?: Record<string, string> | string
    date?: ConditionalDateProps
  }
}

export type GroupField<TSlug extends CollectionSlug = any> = Omit<FieldBase<TSlug>, 'required' | 'validation'> & {
  type: 'group';
  fields: Field<any>[]; // TODO: Find a way to type this
  admin?: Admin & {
    hideGutter?: boolean
  }
  /** Customize generated GraphQL and Typescript schema names.
   * By default it is bound to the collection.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique among collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
}

export type RowAdmin = Omit<Admin, 'description'>;

export type RowField<TSlug extends CollectionSlug = any> = Omit<FieldBase<TSlug>, 'admin' | 'name' | 'label'> & {
  admin?: RowAdmin;
  type: 'row';
  fields: Field<any>[]; // TODO: Find a way to type this
}

export type CollapsibleField<TSlug extends CollectionSlug = any> = Omit<FieldBase<TSlug>, 'name' | 'label'> & {
  type: 'collapsible';
  label: RowLabel
  fields: Field<any>[]; // TODO: Find a way to type this
  admin?: Admin & {
    initCollapsed?: boolean | false;
  }
}

export type TabsAdmin = Omit<Admin, 'description'>;

type TabBase<TSlug extends CollectionSlug = any> = Omit<FieldBase<TSlug>, 'required' | 'validation'> & {
  fields: Field<any>[] // TODO: Find a way to type this
  description?: Description
  interfaceName?: string
}

export type NamedTab<TSlug extends CollectionSlug = any> = TabBase<TSlug> & {
  /** Customize generated GraphQL and Typescript schema names.
   * The slug is used by default.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique among collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
}

export type UnnamedTab<TSlug extends CollectionSlug = any> = Omit<TabBase<TSlug>, 'name'> & {
  label: Record<string, string> | string
  localized?: never
  interfaceName?: never
}

export type Tab<TSlug extends CollectionSlug = any> = NamedTab<TSlug> | UnnamedTab<TSlug>

export type TabsField<TSlug extends CollectionSlug = any> = Omit<FieldBase<TSlug>, 'admin' | 'name' | 'localized'> & {
  type: 'tabs';
  tabs: Tab<TSlug>[]
  admin?: TabsAdmin
}

export type TabAsField<TSlug extends CollectionSlug = any> = Tab<TSlug> & {
  type: 'tab'
  name?: string
};

export type UIField = {
  name: string
  label?: Record<string, string> | string
  admin: {
    position?: string
    width?: string
    condition?: Condition
    disableBulkEdit?: boolean
    components?: {
      Filter?: React.ComponentType<any>;
      Cell?: React.ComponentType<any>;
      Field: React.ComponentType<any>;
    }
  }
  type: 'ui';
  /** Extension  point to add your custom data. */
  custom?: Record<string, any>;
}

export type UploadField<TSlug extends CollectionSlug = any> = FieldBase<TSlug> & {
  type: 'upload'
  relationTo: string
  maxDepth?: number
  filterOptions?: FilterOptions;
}

type CodeAdmin = Admin & {
  language?: string;
  editorOptions?: EditorProps['options'];
}

export type CodeField<TSlug extends CollectionSlug = any> = Omit<FieldBase<TSlug>, 'admin'> & {
  admin?: CodeAdmin
  minLength?: number
  maxLength?: number
  type: 'code';
}

type JSONAdmin = Admin & {
  editorOptions?: EditorProps['options'];
}

export type JSONField<TSlug extends CollectionSlug = any> = Omit<FieldBase<TSlug>, 'admin'> & {
  admin?: JSONAdmin
  type: 'json';
}

export type SelectField<TSlug extends CollectionSlug = any> = FieldBase<TSlug> & {
  type: 'select'
  options: Option[]
  hasMany?: boolean
  admin?: Admin & {
    isClearable?: boolean;
    isSortable?: boolean;
  }
}

export type RelationshipField<TSlug extends CollectionSlug = any> = FieldBase<TSlug> & {
  type: 'relationship';
  relationTo: CollectionSlug | CollectionSlug[];
  hasMany?: boolean;
  maxDepth?: number;
  filterOptions?: FilterOptions;
  admin?: Admin & {
    isSortable?: boolean;
    allowCreate?: boolean;
  },
} & ({
  hasMany: true
  /**
   * @deprecated Use 'minRows' instead
   */
  min?: number
  /**
   * @deprecated Use 'maxRows' instead
   */
  max?: number
  minRows?: number
  maxRows?: number
} | {
  hasMany?: false | undefined
  /**
   * @deprecated Use 'minRows' instead
   */
  min?: undefined
  /**
   * @deprecated Use 'maxRows' instead
   */
  max?: undefined
  minRows?: undefined
  maxRows?: undefined
})

export type ValueWithRelation = {
  relationTo: string
  value: string | number
}

export function valueIsValueWithRelation(value: unknown): value is ValueWithRelation {
  return value !== null && typeof value === 'object' && 'relationTo' in value && 'value' in value;
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

export type RichTextField<TSlug extends CollectionSlug = any> = FieldBase<TSlug> & {
  type: 'richText';
  admin?: Admin & {
    placeholder?: Record<string, string> | string
    elements?: RichTextElement[];
    leaves?: RichTextLeaf[];
    hideGutter?: boolean
    upload?: {
      collections: {
        [collection: string]: {
          fields: Field<any>[]; // TODO: Find a way to type this
        }
      }
    }
    link?: {
      fields?: Field<TSlug>[] | ((args: { defaultFields: Field<any>[], config: SanitizedConfig, i18n: Ii18n }) => Field<TSlug>[]); // TODO: Find a way to type this
    }
  }
}

export type ArrayField<TSlug extends CollectionSlug = any> = FieldBase<TSlug> & {
  type: 'array';
  minRows?: number;
  maxRows?: number;
  labels?: Labels;
  fields: Field<any>[]; // TODO: Find a way to type this
  admin?: Admin & {
    initCollapsed?: boolean | false;
    components?: {
      RowLabel?: RowLabel
    } & Admin['components']
  };
  /** Customize generated GraphQL and Typescript schema names.
   * By default it is bound to the collection.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique among collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
};

export type RadioField<TSlug extends CollectionSlug = any> = FieldBase<TSlug> & {
  type: 'radio';
  options: Option[]
  admin?: Admin & {
    layout?: 'horizontal' | 'vertical'
  }
}

export type Block<TSlug extends CollectionSlug = any> = {
  slug: string;
  labels?: Labels;
  fields: Field<any>[] // TODO: Find a way to type this
  imageURL?: string;
  imageAltText?: string;
  /** @deprecated - please migrate to the interfaceName property instead. */
  graphQL?: {
    singularName?: string
  }
  /** Customize generated GraphQL and Typescript schema names.
   * The slug is used by default.
   *
   * This is useful if you would like to generate a top level type to share amongst collections/fields.
   * **Note**: Top level types can collide, ensure they are unique among collections, arrays, groups, blocks, tabs.
   */
  interfaceName?: string
}

export type BlockField<TSlug extends CollectionSlug = any> = FieldBase<TSlug> & {
  type: 'blocks';
  minRows?: number;
  maxRows?: number;
  blocks: Block<TSlug>[];
  defaultValue?: unknown
  labels?: Labels
  admin?: Admin & {
    initCollapsed?: boolean | false;
  }

}

export type PointField<TSlug extends CollectionSlug = any> = FieldBase<TSlug> & {
  type: 'point',
}

export type Field<TSlug extends CollectionSlug = any> =
  TextField<TSlug>
  | NumberField<TSlug>
  | EmailField<TSlug>
  | TextareaField<TSlug>
  | CheckboxField<TSlug>
  | DateField<TSlug>
  | BlockField<TSlug>
  | GroupField<TSlug>
  | RadioField<TSlug>
  | RelationshipField<TSlug>
  | ArrayField<TSlug>
  | RichTextField<TSlug>
  | SelectField<TSlug>
  | UploadField<TSlug>
  | CodeField<TSlug>
  | JSONField<TSlug>
  | PointField<TSlug>
  | RowField<TSlug>
  | CollapsibleField<TSlug>
  | TabsField<TSlug>
  | UIField;

export type FieldAffectingData<TSlug extends CollectionSlug = any> =
  TextField<TSlug>
  | NumberField<TSlug>
  | EmailField<TSlug>
  | TextareaField<TSlug>
  | CheckboxField<TSlug>
  | DateField<TSlug>
  | BlockField<TSlug>
  | GroupField<TSlug>
  | RadioField<TSlug>
  | RelationshipField<TSlug>
  | ArrayField<TSlug>
  | RichTextField<TSlug>
  | SelectField<TSlug>
  | UploadField<TSlug>
  | CodeField<TSlug>
  | JSONField<TSlug>
  | PointField<TSlug>
  | TabAsField<TSlug>

export type NonPresentationalField<TSlug extends CollectionSlug = any> =
  TextField<TSlug>
  | NumberField<TSlug>
  | EmailField<TSlug>
  | TextareaField<TSlug>
  | CheckboxField<TSlug>
  | DateField<TSlug>
  | BlockField<TSlug>
  | GroupField<TSlug>
  | RadioField<TSlug>
  | RelationshipField<TSlug>
  | ArrayField<TSlug>
  | RichTextField<TSlug>
  | SelectField<TSlug>
  | UploadField<TSlug>
  | CodeField<TSlug>
  | JSONField<TSlug>
  | PointField<TSlug>
  | RowField<TSlug>
  | TabsField<TSlug>
  | CollapsibleField<TSlug>;

export type FieldWithPath<TSlug extends CollectionSlug = any> = Field<TSlug> & {
  path?: string
}

export type FieldWithSubFields<TSlug extends CollectionSlug = any> =
  GroupField<TSlug>
  | ArrayField<TSlug>
  | RowField<TSlug>
  | CollapsibleField<TSlug>;

export type FieldPresentationalOnly =
  UIField;

export type FieldWithMany<TSlug extends CollectionSlug = any> =
  SelectField<TSlug>
  | RelationshipField<TSlug>

export type FieldWithMaxDepth<TSlug extends CollectionSlug = any> =
  UploadField<TSlug>
  | RelationshipField<TSlug>

export function fieldHasSubFields(field: Field<any>): field is FieldWithSubFields<any> {
  return (field.type === 'group' || field.type === 'array' || field.type === 'row' || field.type === 'collapsible');
}

export function fieldIsArrayType(field: Field<any>): field is ArrayField<any> {
  return field.type === 'array';
}

export function fieldIsBlockType(field: Field<any>): field is BlockField<any> {
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

export function fieldSupportsMany(field: Field<any>): field is FieldWithMany<any> {
  return field.type === 'select' || field.type === 'relationship';
}

export function fieldHasMaxDepth(field: Field<any>): field is FieldWithMaxDepth<any> {
  return (field.type === 'upload' || field.type === 'relationship') && typeof field.maxDepth === 'number';
}

export function fieldIsPresentationalOnly(field: Field<any> | TabAsField<any>): field is UIField {
  return field.type === 'ui';
}

export function fieldAffectsData(field: Field<any> | TabAsField<any>): field is FieldAffectingData<any> {
  return 'name' in field && !fieldIsPresentationalOnly(field);
}

export function tabHasName(tab: Tab<any>): tab is NamedTab<any> {
  return 'name' in tab;
}

export function fieldIsLocalized(field: Field<any> | Tab<any>): boolean {
  return 'localized' in field && field.localized;
}

export type HookName = 'beforeRead' | 'beforeChange' | 'beforeValidate' | 'afterChange' | 'afterRead';
