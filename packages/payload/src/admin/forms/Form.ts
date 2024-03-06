import type { ClientValidate, Field } from '../../fields/config/types.d.ts'

export type Data = {
  [key: string]: any
}

export type Row = {
  blockType?: string
  collapsed?: boolean
  errorPaths?: Set<string>
  id: string
}

export type FormField = {
  disableFormData?: boolean
  errorMessage?: string
  errorPaths?: Set<string>
  fieldSchema?: Field
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
