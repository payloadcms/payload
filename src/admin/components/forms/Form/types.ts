import { Field as FieldConfig, Condition, Validate } from '../../../../fields/config/types';

export type Field = {
  value: unknown
  field: Field
  initialValue: unknown
  errorMessage?: string
  valid: boolean
  validate?: Validate
  disableFormData?: boolean
  ignoreWhileFlattening?: boolean
  condition?: Condition
  passesCondition?: boolean
}

export type Fields = {
  [path: string]: Field
}

export type Data = {
  [key: string]: any
}

export type Preferences = {
  [key: string]: unknown
}

export type Props = {
  disabled?: boolean
  onSubmit?: (fields: Fields, data: Data) => void
  method?: 'get' | 'put' | 'delete' | 'post'
  action?: string
  handleResponse?: (res: Response) => void
  onSuccess?: (json: unknown) => void
  className?: string
  redirect?: string
  disableSuccessStatus?: boolean
  initialState?: Fields
  initialData?: Data
  waitForAutocomplete?: boolean
  log?: boolean
  validationOperation?: 'create' | 'update'
}

export type SubmitOptions = {
  action?: string
  method?: string
  overrides?: Record<string, unknown>
  skipValidation?: boolean
}

export type DispatchFields = React.Dispatch<any>
export type Submit = (options?: SubmitOptions, e?: React.FormEvent<HTMLFormElement>) => void;
export type ValidateForm = () => Promise<boolean>;
export type CreateFormData = (overrides?: any) => FormData;
export type GetFields = () => Fields;
export type GetField = (path: string) => Field;
export type GetData = () => Data;
export type GetSiblingData = (path: string) => Data;
export type GetUnflattenedValues = () => Data;
export type GetDataByPath = <T = unknown>(path: string) => T;
export type SetModified = (modified: boolean) => void;
export type SetSubmitted = (submitted: boolean) => void;
export type SetProcessing = (processing: boolean) => void;

export type Reset = (fieldSchema: FieldConfig[], data: unknown) => Promise<void>

export type Context = {
  dispatchFields: DispatchFields
  submit: Submit
  fields: Fields
  initialState: Fields
  validateForm: ValidateForm
  createFormData: CreateFormData
  disabled: boolean
  getFields: GetFields
  getField: GetField
  getData: GetData
  getSiblingData: GetSiblingData
  getUnflattenedValues: GetUnflattenedValues
  getDataByPath: GetDataByPath
  setModified: SetModified
  setProcessing: SetProcessing
  setSubmitted: SetSubmitted
  formRef: React.MutableRefObject<HTMLFormElement>
  reset: Reset
}
