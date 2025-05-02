import type {
  Block,
  CollectionBeforeChangeHook,
  CollectionConfig,
  Field,
  TypeWithID,
} from 'payload'

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

export type PaymentFieldConfig = {
  paymentProcessor: Partial<SelectField>
} & Partial<Field>

export type FieldConfig = Partial<Field> | PaymentFieldConfig

export interface FieldsConfig {
  [key: string]: boolean | FieldConfig | undefined
  checkbox?: boolean | FieldConfig
  country?: boolean | FieldConfig
  email?: boolean | FieldConfig
  message?: boolean | FieldConfig
  number?: boolean | FieldConfig
  payment?: boolean | FieldConfig
  select?: boolean | FieldConfig
  state?: boolean | FieldConfig
  text?: boolean | FieldConfig
  textarea?: boolean | FieldConfig
}

type BeforeChangeParams<T extends TypeWithID = any> = Parameters<CollectionBeforeChangeHook<T>>[0]
export type BeforeEmail<T extends TypeWithID = any> = (
  emails: FormattedEmail[],
  beforeChangeParams: BeforeChangeParams<T>,
) => FormattedEmail[] | Promise<FormattedEmail[]>
export type HandlePayment = (data: any) => void
export type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]

export type FormBuilderPluginConfig = {
  beforeEmail?: BeforeEmail
  /**
   * Set a default email address to send form submissions to if no email is provided in the form configuration
   * Falls back to the defaultFromAddress in the email configuration
   */
  defaultToEmail?: string
  fields?: FieldsConfig
  formOverrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  formSubmissionOverrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
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
  placeholder?: string
  required?: boolean
  width?: number
}

export interface RadioField {
  blockName?: string
  blockType: 'radio'
  defaultValue?: string
  label?: string
  name: string
  options: SelectFieldOption[]
  placeholder?: string
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
  message: object
}

export type FormFieldBlock =
  | CheckboxField
  | CountryField
  | EmailField
  | MessageField
  | PaymentField
  | RadioField
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
