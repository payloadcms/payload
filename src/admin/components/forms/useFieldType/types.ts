import { Validate } from '../../../../fields/config/types';

export type Options = {
  path: string
  validate?: Validate
  enableDebouncedValue?: boolean
  disableFormData?: boolean
  ignoreWhileFlattening?: boolean
  stringify?: boolean
}

export type FieldType = {
  value: unknown
  errorMessage?: string
  showError: boolean
  formSubmitted: boolean
  formProcessing: boolean
  setValue: (val: unknown) => void
}
