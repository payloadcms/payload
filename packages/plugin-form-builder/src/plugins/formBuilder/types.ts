import { RichText } from '@trbl/hope-types';
import { Block, CollectionConfig, Field } from 'payload/types';

export type BlockConfig = {
  block: Block
  validate?: (value: unknown) => boolean | string
}

export function isValidBlockConfig(blockConfig: BlockConfig | string): blockConfig is BlockConfig {
  return typeof blockConfig !== 'string'
    && typeof blockConfig?.block?.slug === 'string'
    && Array.isArray(blockConfig?.block?.fields);
}

export type FieldConfig = {
  [key: string]: Partial<Field>
  paymentProcessor: Partial<SelectField>
}

export type FieldsConfig = {
  select?: boolean | FieldConfig
  text?: boolean | FieldConfig
  email?: boolean | FieldConfig
  state?: boolean | FieldConfig
  country?: boolean | FieldConfig
  checkbox?: boolean | FieldConfig
  number?: boolean | FieldConfig
  message?: boolean | FieldConfig
  payment?: boolean | FieldConfig
}

export type BeforeEmail = (emails: FormattedEmail[]) => void;
export type HandlePayment = (data) => void;

export type FormConfig = {
  fields?: FieldsConfig
  formSubmissionsOverrides?: CollectionConfig
  formsOverrides?: CollectionConfig
  beforeEmail?: BeforeEmail
  handlePayment?: HandlePayment
}

export type TextField = {
  blockType: 'text'
  blockName?: string
  width?: string
  name: string
  label?: string
  defaultValue?: string
  required?: boolean
}

export type SelectFieldOption = {
  label: string
  value: string
}

export type SelectField = {
  blockType: 'select'
  blockName?: string
  width?: string
  name: string
  label?: string
  defaultValue?: string
  required?: boolean
  options: SelectFieldOption[]
}

export type EmailField = {
  blockType: 'email'
  blockName?: string
  width?: string
  name: string
  label?: string
  defaultValue?: string
  required?: boolean
}

export type StateField = {
  blockType: 'state'
  blockName?: string
  width?: string
  name: string
  label?: string
  defaultValue?: string
  required?: boolean
}

export type CountryField = {
  blockType: 'country'
  blockName?: string
  width?: string
  name: string
  label?: string
  defaultValue?: string
  required?: boolean
}

export type CheckboxField = {
  blockType: 'checkbox'
  blockName?: string
  width?: string
  name: string
  label?: string
  defaultValue?: boolean
  required?: boolean
}

export type MessageField = {
  blockType: 'message'
  blockName?: string
  message: unknown
}

export type FormFieldBlock = TextField | SelectField | EmailField | StateField | CountryField | CheckboxField | MessageField | unknown

export type Email = {
  emailTo: string
  emailFrom: string
  bcc?: string
  replyTo?: string
  subject: string
  message?: RichText
}

export type FormattedEmail = {
  to: string
  from: string
  subject: string
  html: string
}

export type Redirect = {
  type: 'reference' | 'custom'
  reference?: {
    relationTo: 'people' | 'posts' | 'pages' | 'housing'
    value: string | unknown
  }
  url: string
}

export type Form = {
  title: string
  fields: FormFieldBlock[]
  submitButtonLabel?: string
  confirmationType: 'message' | 'redirect'
  confirmationMessage?: RichText
  redirect?: Redirect
  emails: Email[]
}

export type SubmissionValue = {
  field: string
  value: unknown
}

export type FormSubmission = {
  form: string | Form
  submissionData: SubmissionValue[]
}
