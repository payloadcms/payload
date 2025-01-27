import type { Condition, Validate } from '../../../../fields/config/types'
import type { Row } from '../Form/types'

export type Options = {
  condition?: Condition
  disableFormData?: boolean
  hasRows?: boolean
  path: string
  validate?: Validate
}

export type FieldType<T> = {
  errorMessage?: string
  formProcessing: boolean
  formSubmitted: boolean
  initialValue?: T
  rows?: Row[]
  setValue: (val: unknown, disableModifyingForm?: boolean) => void
  showError: boolean
  valid?: boolean
  value: T
}
