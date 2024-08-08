import type { Payload } from 'payload'
import type { Block, CollectionConfig, Field } from 'payload/types'

export interface BlockConfig {
  block: Block
  validate?: (value: unknown) => boolean | string
}

export function isValidBlockConfig(blockConfig: BlockConfig | string): blockConfig is BlockConfig {
  return (
    typeof blockConfig !== 'string' &&
    typeof blockConfig?.block?.slug === 'string' &&
    Array.isArray(blockConfig?.block?.fields)
  )
}

export interface FieldValues {
  [key: string]: boolean | null | number | string | undefined
}

export type PaymentFieldConfig = Partial<Field> & {
  paymentProcessor: Partial<SelectField>
}

export type FieldConfig = Partial<Field> | PaymentFieldConfig

export interface FieldsConfig {
  [key: string]: FieldConfig | boolean | undefined
  checkbox?: FieldConfig | boolean
  country?: FieldConfig | boolean
  email?: FieldConfig | boolean
  message?: FieldConfig | boolean
  number?: FieldConfig | boolean
  payment?: FieldConfig | boolean
  select?: FieldConfig | boolean
  state?: FieldConfig | boolean
  text?: FieldConfig | boolean
  textarea?: FieldConfig | boolean
}

export type BeforeEmail = (emails: FormattedEmail[], payload: Payload, formSubmission: FormSubmission) => FormattedEmail[] | Promise<FormattedEmail[]>
export type HandlePayment = (data: any) => void

export interface PluginConfig {
  beforeEmail?: BeforeEmail
  fields?: FieldsConfig
  formOverrides?: Partial<CollectionConfig>
  formSubmissionOverrides?: Partial<CollectionConfig>
  handlePayment?: HandlePayment
  redirectRelationships?: string[]
}

export interface TextField {
  blockName?: string
  blockType: 'text'
  defaultValue?: string
  label?: string
  name: string
  required?: boolean
  width?: number
}

export interface TextAreaField {
  blockName?: string
  blockType: 'textarea'
  defaultValue?: string
  label?: string
  name: string
  required?: boolean
  width?: number
}

export interface SelectFieldOption {
  label: string
  value: string
}

export interface SelectField {
  blockName?: string
  blockType: 'select'
  defaultValue?: string
  label?: string
  name: string
  options: SelectFieldOption[]
  required?: boolean
  width?: number
}

export interface PriceCondition {
  condition: 'equals' | 'hasValue' | 'notEquals'
  fieldToUse: string
  operator: 'add' | 'divide' | 'multiply' | 'subtract'
  valueForCondition: string
  valueForOperator: number | string // TODO: make this a number, see ./collections/Forms/DynamicPriceSelector.tsx
  valueType: 'static' | 'valueOfField'
}

export interface PaymentField {
  basePrice: number
  blockName?: string
  blockType: 'payment'
  defaultValue?: string
  label?: string
  name: string
  paymentProcessor: string
  priceConditions: PriceCondition[]
  required?: boolean
  width?: number
}

export interface EmailField {
  blockName?: string
  blockType: 'email'
  defaultValue?: string
  label?: string
  name: string
  required?: boolean
  width?: number
}

export interface StateField {
  blockName?: string
  blockType: 'state'
  defaultValue?: string
  label?: string
  name: string
  required?: boolean
  width?: number
}

export interface CountryField {
  blockName?: string
  blockType: 'country'
  defaultValue?: string
  label?: string
  name: string
  required?: boolean
  width?: number
}

export interface CheckboxField {
  blockName?: string
  blockType: 'checkbox'
  defaultValue?: boolean
  label?: string
  name: string
  required?: boolean
  width?: number
}

export interface MessageField {
  blockName?: string
  blockType: 'message'
  message: unknown
}

export type FormFieldBlock =
  | CheckboxField
  | CountryField
  | EmailField
  | MessageField
  | PaymentField
  | SelectField
  | StateField
  | TextAreaField
  | TextField

export interface Email {
  bcc?: string
  cc?: string
  emailFrom: string
  emailTo: string
  message?: any // TODO: configure rich text type
  replyTo?: string
  subject: string
}

export interface FormattedEmail {
  bcc?: string
  cc?: string
  from: string
  html: string
  replyTo: string
  subject: string
  to: string
}

export interface Redirect {
  reference?: {
    relationTo: string
    value: string | unknown
  }
  type: 'custom' | 'reference'
  url: string
}

export interface Form {
  confirmationMessage?: any // TODO: configure rich text type
  confirmationType: 'message' | 'redirect'
  emails: Email[]
  fields: FormFieldBlock[]
  id: string
  redirect?: Redirect
  submitButtonLabel?: string
  title: string
}

export interface SubmissionValue {
  field: string
  value: unknown
}

export interface FormSubmission {
  form: Form | string
  submissionData: SubmissionValue[]
}
