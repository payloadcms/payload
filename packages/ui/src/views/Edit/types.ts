import type { SanitizedCollectionConfig } from 'payload/types'
import { FieldTypes } from 'payload/config'
import { EditViewProps } from '../types'

export type IndexProps = {
  collection: SanitizedCollectionConfig
  isEditing?: boolean
}

export type DefaultEditViewProps = EditViewProps & {
  BeforeDocument?: React.ReactNode
  disableRoutes?: boolean
  fieldTypes: FieldTypes
}
