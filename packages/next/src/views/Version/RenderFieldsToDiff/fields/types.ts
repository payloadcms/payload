import type { I18nClient } from '@payloadcms/translations'
import type { ClientFieldConfig, FieldPermissions } from 'payload'
import type React from 'react'
import type { DiffMethod } from 'react-diff-viewer-continued'

export type DiffComponents = Record<string, React.FC<Props>>

export type Props = {
  readonly comparison: any
  readonly diffComponents: DiffComponents
  readonly diffMethod?: DiffMethod
  readonly disableGutter?: boolean
  readonly field: ClientFieldConfig
  readonly fields: ClientFieldConfig[]
  readonly i18n: I18nClient
  readonly isRichText?: boolean
  readonly locale?: string
  readonly locales?: string[]
  readonly permissions?: Record<string, FieldPermissions>
  readonly version: any
}
