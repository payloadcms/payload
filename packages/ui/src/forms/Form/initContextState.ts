import type {
  Context,
  CreateFormData,
  Data,
  DispatchFields,
  Fields,
  FormField,
  GetSiblingData,
  Reset,
  SetModified,
  SetProcessing,
  SetSubmitted,
  Submit,
  ValidateForm,
} from './types'

const submit: Submit = () => undefined
const getSiblingData: GetSiblingData = () => undefined
const dispatchFields: DispatchFields = () => undefined
const validateForm: ValidateForm = () => undefined
const createFormData: CreateFormData = () => undefined

const setModified: SetModified = () => undefined
const setProcessing: SetProcessing = () => undefined
const setSubmitted: SetSubmitted = () => undefined
const reset: Reset = () => undefined

const initialContextState: Context = {
  addFieldRow: () => undefined,
  buildRowErrors: () => undefined,
  createFormData,
  disabled: false,
  dispatchFields,
  fields: {},
  formRef: null,
  getData: (): Data => undefined,
  getDataByPath: () => undefined,
  getField: (): FormField => undefined,
  getFields: (): Fields => ({}),
  getSiblingData,
  removeFieldRow: () => undefined,
  replaceFieldRow: () => undefined,
  replaceState: () => undefined,
  reset,
  setModified,
  setProcessing,
  setSubmitted,
  submit,
  validateForm,
}

export default initialContextState
