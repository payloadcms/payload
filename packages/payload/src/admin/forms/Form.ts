import { type SupportedLanguages } from '@payloadcms/translations'

import type { Field, Validate } from '../../fields/config/types.js'
import type { DocumentPreferences } from '../../preferences/types.js'
import type { PayloadRequest, Where } from '../../types/index.js'

export type Data = {
  [key: string]: any
}

export type Row = {
  blockType?: string
  collapsed?: boolean
  id: string
}

export type FilterOptionsResult = {
  [relation: string]: boolean | Where
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
  validate?: Validate
  value: unknown
}

export type FormState = {
  [path: string]: FormField
}

export type BuildFormStateArgs = {
  collectionSlug?: string
  data?: Data
  docPreferences?: DocumentPreferences
  formState?: FormState
  globalSlug?: string
  id?: number | string
  /*
    If not i18n was passed, the language can be passed to init i18n
  */
  language?: keyof SupportedLanguages
  locale?: string
  operation?: 'create' | 'update'
  req: PayloadRequest
  returnLockStatus?: boolean
  schemaPath: string
  updateLastEdited?: boolean
}
