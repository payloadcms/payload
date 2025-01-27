import type { I18nClient } from '@payloadcms/translations'
import type { ClientField, Field, SanitizedFieldPermissions } from 'payload'
import type { DiffMethod } from 'react-diff-viewer-continued'

import type { VersionField } from '../buildVersionState.js'

export type DiffComponents = Record<string, React.FC<DiffComponentProps>>

export type DiffComponentProps<TClientField extends ClientField = ClientField> = {
  comparison: Record<string, any>
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
  version: Record<string, any>
  versionField: VersionField
}

export type DiffComponentServerProps<
  TField extends Field = Field,
  TClientField extends ClientField = ClientField,
> = {
  clientField: TClientField
  field: TField
  i18n: I18nClient
} & Omit<DiffComponentProps, 'field'>
