import type { I18nClient } from '@payloadcms/translations'
import type { ClientField, FieldPermissions } from 'payload'
import type React from 'react'
import type { DiffMethod } from 'react-diff-viewer-continued'

export type DiffComponents = Record<string, React.FC<DiffComponentProps>>

export type DiffComponentProps<TField extends ClientField = ClientField> = {
  readonly comparison: any
  readonly diffComponents: DiffComponents
  readonly diffMethod?: DiffMethod
  readonly disableGutter?: boolean
  readonly field: TField
  readonly fields: ClientField[]
  readonly i18n: I18nClient
  readonly isRichText?: boolean
  readonly locale?: string
  readonly locales?: string[]
  readonly modifiedOnly?: boolean
  readonly permissions?: Record<string, FieldPermissions>
  readonly version: any
}
