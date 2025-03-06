import type { FormField, FormState, Row, User, ValidationFieldError } from 'payload'

export type REPLACE_STATE = {
  optimize?: boolean
  /**
   * If `sanitize` is true, default values will be set for form field properties that are not present in the incoming state.
   * For example, `valid` will be set to true if it is not present in the incoming state.
   */
  sanitize?: boolean
  state: FormState
  type: 'REPLACE_STATE'
}

export type REMOVE = {
  path: string
  type: 'REMOVE'
}

export type MODIFY_CONDITION = {
  path: string
  result: boolean
  type: 'MODIFY_CONDITION'
  user: User
}

export type UPDATE = {
  path: string
  type: 'UPDATE'
} & Partial<FormField>

export type UPDATE_MANY = {
  formState: FormState
  type: 'UPDATE_MANY'
}

export type REMOVE_ROW = {
  path: string
  rowIndex: number
  type: 'REMOVE_ROW'
}

export type ADD_ROW = {
  blockType?: string
  path: string
  rowIndex?: number
  subFieldState?: FormState
  type: 'ADD_ROW'
}

export type REPLACE_ROW = {
  blockType?: string
  path: string
  rowIndex: number
  subFieldState?: FormState
  type: 'REPLACE_ROW'
}

export type DUPLICATE_ROW = {
  path: string
  rowIndex: number
  type: 'DUPLICATE_ROW'
}

export type MOVE_ROW = {
  moveFromIndex: number
  moveToIndex: number
  path: string
  type: 'MOVE_ROW'
}

export type ADD_SERVER_ERRORS = {
  errors: ValidationFieldError[]
  type: 'ADD_SERVER_ERRORS'
}

export type SET_ROW_COLLAPSED = {
  path: string
  type: 'SET_ROW_COLLAPSED'
  updatedRows: Row[]
}

export type SET_ALL_ROWS_COLLAPSED = {
  path: string
  type: 'SET_ALL_ROWS_COLLAPSED'
  updatedRows: Row[]
}

export type FieldAction =
  | ADD_ROW
  | ADD_SERVER_ERRORS
  | DUPLICATE_ROW
  | MODIFY_CONDITION
  | MOVE_ROW
  | REMOVE
  | REMOVE_ROW
  | REPLACE_ROW
  | REPLACE_STATE
  | SET_ALL_ROWS_COLLAPSED
  | SET_ROW_COLLAPSED
  | UPDATE
  | UPDATE_MANY
