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
  customComponents?: {
    RowLabel?: React.ReactNode
  }
  id: string
  isLoading?: boolean
  lastRenderedPath?: string
}

export type FilterOptionsResult = {
  [relation: string]: boolean | Where
}

export type FieldState = {
  /**
   * This is used to determine if the field was added by the server.
   * This ensures the field is not ignored by the client when merging form state.
   * This can happen because the current local state is treated as the source of truth.
   * See `mergeServerFormState` for more details.
   */
  addedByServer?: boolean
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
  /**
   * The path of the field when its custom components were last rendered.
   * This is used to denote if a field has been rendered, and if so,
   * what path it was rendered under last.
   *
   * If this path is undefined, or, if it is different
   * from the current path of a given field, the field's components will be re-rendered.
   */
  lastRenderedPath?: string
  passesCondition?: boolean
  rows?: Row[]
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
  /**
   * If true, will not render RSCs and instead return a simple string in their place.
   * This is useful for environments that lack RSC support, such as Jest.
   * Form state can still be built, but any server components will be omitted.
   * @default false
   */
  mockRSCs?: boolean
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
