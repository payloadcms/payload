import type { ClientValidate, Field } from '../../fields/config/types.js'
import type { Where } from '../../types/index.js'

export type Data = {
  [key: string]: any
}

export type Row = {
  blockType?: string
  collapsed?: boolean
  errorPaths?: string[]
  id: string
}

export type FilterOptionsResult = {
  [relation: string]: Where | boolean
}

export type FormField = {
  disableFormData?: boolean
  errorMessage?: string
  errorPaths?: string[]
  fieldSchema?: Field
  filterOptions?: FilterOptionsResult
  initialValue: unknown
  passesCondition?: boolean
  rows?: Row[]
  valid: boolean
  validate?: ClientValidate
  value: unknown
}

export type FormState = {
  [path: string]: FormField
}
