import type { I18nClient } from '@payloadcms/translations'
import type { ClientField, Field, SanitizedFieldPermissions } from 'payload'
import type { DiffMethod } from 'react-diff-viewer-continued'

import type { BaseVersionField, VersionField } from '../buildVersionState.js'

export type DiffComponents = Record<string, React.FC<DiffComponentProps>>

export type DiffComponentProps<TClientField extends ClientField = ClientField> = {
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
  fields: ClientField[]
  isRichText: boolean
  locale?: string
  locales: string[]
  /**
   * Field value from the current version
   */
  versionValue: unknown
}

export type DiffComponentServerProps<
  TField extends Field = Field,
  TClientField extends ClientField = ClientField,
> = {
  clientField: TClientField
  field: TField
  i18n: I18nClient
} & Omit<DiffComponentProps, 'field'>
