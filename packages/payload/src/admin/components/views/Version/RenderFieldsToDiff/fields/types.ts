import React from 'react';
import { DiffMethod } from 'react-diff-viewer-continued';
import { FieldPermissions } from '../../../../../../auth/types.js';

export type FieldComponents = Record<string, React.FC<Props>>

export type Props = {
  diffMethod?: DiffMethod
  fieldComponents: FieldComponents
  version: any
  comparison: any
  field: any
  permissions?: Record<string, FieldPermissions>
  locale?: string
  locales?: string[]
  disableGutter?: boolean
  isRichText?: boolean
}
