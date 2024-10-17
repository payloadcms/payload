import type { ContextType } from 'payload/dist/admin/components/utilities/DocumentInfo/types'
import type { Field, TextareaField, TextField, UploadField, Condition, Row, Validate } from 'payload/dist/fields/config/types'
import { Row } from 'payload/dist/admin/components/forms/Form/types';

export type TypedFormField<VALUE> = {
  condition?: Condition;
  disableFormData?: boolean;
  errorMessage?: string;
  fieldSchema?: Field;
  initialValue: unknown;
  passesCondition?: boolean;
  previousValue?: unknown;
  rows?: Row[];
  valid: boolean;
  validate?: Validate;
  value: VALUE;
};
export type TypedFormDocument<T = any> = {
  [key in keyof T]: TypedFormField<T[key]>;
}
export type GenerateTitle<T = any> = (
  args: ContextType & { doc: T; locale?: string },
) => Promise<string> | string

export type GenerateDescription<T = any> = (
  args: ContextType & {
    doc: T
    locale?: string
  },
) => Promise<string> | string

export type GenerateImage<T = any> = (
  args: ContextType & { doc: T; locale?: string },
) => Promise<string> | string

export type GenerateURL<T = any> = (
  args: ContextType & { doc: T; locale?: string },
) => Promise<string> | string

export interface PluginConfig<T = any> {
  collections?: string[]
  fields?: Field[]
  generateDescription?: GenerateDescription<T>
  generateImage?: GenerateImage<T>
  generateTitle?: GenerateTitle<T>
  generateURL?: GenerateURL<T>
  globals?: string[]
  tabbedUI?: boolean
  fieldOverrides?: {
    title?: Partial<TextField>
    description?: Partial<TextareaField>
    image?: Partial<UploadField>
  }
  interfaceName?: string
  uploadsCollection?: string
}

export interface Meta {
  description?: string
  image?: any // TODO: type this
  keywords?: string
  title?: string
}
