import { type SupportedLanguages } from '@payloadcms/translations'

import type { SanitizedDocumentPermissions } from '../../auth/types.js'
import type { Field, Validate } from '../../fields/config/types.js'
import type { TypedLocale } from '../../index.js'
import type { DocumentPreferences } from '../../preferences/types.js'
import type { PayloadRequest, SelectType, Where } from '../../types/index.js'

export type Data = {
  [key: string]: any
}

export type Row = {
  blockType?: string
  collapsed?: boolean
  id: string
  isLoading?: boolean
}

export type FilterOptionsResult = {
  [relation: string]: boolean | Where
}

export type FieldState = {
  customComponents?: {
    /**
     * This is used by UI fields, as they can have arbitrary components defined if used
     * as a vessel to bring in custom components.
     */
    [key: string]: React.ReactNode | React.ReactNode[] | undefined
    AfterInput?: React.ReactNode
    BeforeInput?: React.ReactNode
    Description?: React.ReactNode
    Error?: React.ReactNode
    Field?: React.ReactNode
    Label?: React.ReactNode
    RowLabels?: React.ReactNode[]
  }
  disableFormData?: boolean
  errorMessage?: string
  errorPaths?: string[]
  /**
   * The fieldSchema may be part of the form state if `includeSchema: true` is passed to buildFormState.
   * This will never be in the form state of the client.
   */
  fieldSchema?: Field
  filterOptions?: FilterOptionsResult
  initialValue?: unknown
  passesCondition?: boolean
  requiresRender?: boolean
  rows?: Row[]
  /**
   * The `serverPropsToIgnore` obj is used to prevent the various properties from being overridden across form state requests.
   * This can happen when queueing a form state request with `requiresRender: true` while the another is already processing.
   * For example:
   *   1. One "add row" action will set `requiresRender: true` and dispatch a form state request
   *   2. Another "add row" action will set `requiresRender: true` and queue a form state request
   *   3. The first request will return with `requiresRender: false`
   *   4. The second request will be dispatched with `requiresRender: false` but should be `true`
   * To fix this, only merge the `requiresRender` property if the previous state has not set it to `true`.
   * See the `mergeServerFormState` function for implementation details.
   */
  serverPropsToIgnore?: Array<keyof FieldState>
  valid?: boolean
  validate?: Validate
  value?: unknown
}

export type FieldStateWithoutComponents = Omit<FieldState, 'customComponents'>

export type FormState = {
  [path: string]: FieldState
}

export type FormStateWithoutComponents = {
  [path: string]: FieldStateWithoutComponents
}

export type BuildFormStateArgs = {
  data?: Data
  docPermissions: SanitizedDocumentPermissions | undefined
  docPreferences: DocumentPreferences
  /**
   * In case `formState` is not the top-level, document form state, this can be passed to
   * provide the top-level form state.
   */
  documentFormState?: FormState
  fallbackLocale?: false | TypedLocale
  formState?: FormState
  id?: number | string
  initialBlockData?: Data
  initialBlockFormState?: FormState
  /*
    If not i18n was passed, the language can be passed to init i18n
  */
  language?: keyof SupportedLanguages
  locale?: string
  operation?: 'create' | 'update'
  /*
    If true, will render field components within their state object
  */
  renderAllFields?: boolean
  req: PayloadRequest
  returnLockStatus?: boolean
  schemaPath: string
  select?: SelectType
  skipValidation?: boolean
  updateLastEdited?: boolean
} & (
  | {
      collectionSlug: string
      // Do not type it as never. This still makes it so that either collectionSlug or globalSlug is required, but makes it easier to provide both collectionSlug and globalSlug if it's
      // unclear which one is actually available.
      globalSlug?: string
    }
  | {
      collectionSlug?: string
      globalSlug: string
    }
)
