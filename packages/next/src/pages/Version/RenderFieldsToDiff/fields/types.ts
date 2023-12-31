import type React from 'react'
import type { DiffMethod } from 'react-diff-viewer-continued'

import type { FieldPermissions } from '../../../../../../auth'

export type FieldComponents = Record<string, React.FC<Props>>

export type Props = {
  comparison: any
  diffMethod?: DiffMethod
  disableGutter?: boolean
  field: any
  fieldComponents: FieldComponents
  isRichText?: boolean
  locale?: string
  locales?: string[]
  permissions?: Record<string, FieldPermissions>
  version: any
}
