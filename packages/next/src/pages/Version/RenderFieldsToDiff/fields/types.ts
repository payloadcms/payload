import type React from 'react'
import type { DiffMethod } from 'react-diff-viewer-continued'

import type { FieldPermissions } from 'payload/auth'
import type { I18n } from '@payloadcms/translations'
import { SanitizedConfig } from 'payload/types'

export type FieldComponents = Record<string, React.FC<Props>>

export type Props = {
  comparison: any
  diffMethod?: DiffMethod
  disableGutter?: boolean
  field: any
  fieldComponents: FieldComponents
  isRichText?: boolean
  locale: string
  locales?: string[]
  permissions?: Record<string, FieldPermissions>
  version: any
  i18n: I18n
  config: SanitizedConfig
}
