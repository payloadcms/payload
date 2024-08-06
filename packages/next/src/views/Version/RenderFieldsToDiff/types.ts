import type { I18nClient } from '@payloadcms/translations'
import type { ClientFieldConfig, FieldPermissions } from 'payload'
import type { DiffMethod } from 'react-diff-viewer-continued'

import type { DiffComponents } from './fields/types.js'

export type Props = {
  readonly comparison: Record<string, any>
  readonly diffComponents: DiffComponents
  readonly fieldPermissions: Record<string, FieldPermissions>
  readonly fields: ClientFieldConfig[]
  readonly i18n: I18nClient
  readonly locales: string[]
  readonly version: Record<string, any>
}

export type FieldDiffProps = {
  diffMethod: DiffMethod
  field: ClientFieldConfig
  isRichText: boolean
} & Props
