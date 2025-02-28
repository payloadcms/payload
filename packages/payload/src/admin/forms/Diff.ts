// @ts-strict-ignore

import type { I18nClient } from '@payloadcms/translations'

import type { ClientField, Field, FieldTypes, Tab } from '../../fields/config/types.js'
import type {
  ClientFieldWithOptionalType,
  PayloadRequest,
  SanitizedFieldPermissions,
  TypedLocale,
} from '../../index.js'

export type VersionTab = {
  fields: VersionField[]
  name?: string
} & Pick<Tab, 'label'>

export type BaseVersionField = {
  CustomComponent?: React.ReactNode
  fields: VersionField[]
  path: string
  rows?: VersionField[][]
  schemaPath: string
  tabs?: VersionTab[]
  type: FieldTypes
}

export type VersionField = {
  field?: BaseVersionField
  fieldByLocale?: Record<TypedLocale, BaseVersionField>
}

/**
 * Taken from react-diff-viewer-continued
 */
export declare enum DiffMethod {
  CHARS = 'diffChars',
  CSS = 'diffCss',
  JSON = 'diffJson',
  LINES = 'diffLines',
  SENTENCES = 'diffSentences',
  TRIMMED_LINES = 'diffTrimmedLines',
  WORDS = 'diffWords',
  WORDS_WITH_SPACE = 'diffWordsWithSpace',
}

export type FieldDiffClientProps<TClientField extends ClientFieldWithOptionalType = ClientField> = {
  baseVersionField: BaseVersionField
  /**
   * Field value from the version being compared
   */
  comparisonValue: unknown
  diffMethod: DiffMethod
  field: TClientField
  fieldPermissions:
    | {
        [key: string]: SanitizedFieldPermissions
      }
    | true
  /**
   * If this field is localized, this will be the locale of the field
   */
  locale?: string
  parentIsLocalized: boolean
  /**
   * Field value from the current version
   */
  versionValue: unknown
}

export type FieldDiffServerProps<
  TField extends Field = Field,
  TClientField extends ClientFieldWithOptionalType = ClientField,
> = {
  clientField: TClientField
  field: TField
  i18n: I18nClient
  req: PayloadRequest
  selectedLocales: string[]
} & Omit<FieldDiffClientProps, 'field'>

export type FieldDiffClientComponent<
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = React.ComponentType<FieldDiffClientProps<TFieldClient>>

export type FieldDiffServerComponent<
  TFieldServer extends Field = Field,
  TFieldClient extends ClientFieldWithOptionalType = ClientFieldWithOptionalType,
> = React.ComponentType<FieldDiffServerProps<TFieldServer, TFieldClient>>
