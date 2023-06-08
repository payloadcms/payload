import { Condition, Validate } from '../../../../fields/config/types';
import { Row } from '../Form/types';

export type Options = {
  path: string
  validate?: Validate
  disableFormData?: boolean
  condition?: Condition
  hasRows?: boolean
}

export type FieldType<T> = {
  value: T
  errorMessage?: string
  showError: boolean
  formSubmitted: boolean
  formProcessing: boolean
  setValue: (val: unknown, modifyForm?: boolean) => void
  initialValue?: T
  rows?: Row[]
}
