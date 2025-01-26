import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientField,
  Field,
  FieldTypes,
  PayloadComponent,
  SanitizedFieldPermissions,
} from 'payload'
import type { DiffMethod } from 'react-diff-viewer-continued'

import type { VersionField } from '../buildVersionState.js'

export type Props = {
  readonly comparison: Record<string, any>
  readonly fieldPermissions:
    | {
        [key: string]: SanitizedFieldPermissions
      }
    | true
  readonly fields: ClientField[]
  readonly locales: string[]
  readonly version: Record<string, any>
}

export type FieldDiffProps = {
  diffMethod: DiffMethod
  field: ClientField
  isRichText: boolean
  versionField: VersionField
} & Props

export type FieldDiffPropsServer = {
  clientField: ClientField
  field: Field
  readonly i18n: I18nClient
} & Omit<FieldDiffProps, 'field'>
