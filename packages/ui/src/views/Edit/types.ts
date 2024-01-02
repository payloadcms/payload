import type { SanitizedCollectionConfig } from 'payload/types'
import { FieldTypes } from '../../forms/field-types'
import type { CollectionEditViewProps } from '../types'

export type IndexProps = {
  collection: SanitizedCollectionConfig
  isEditing?: boolean
}
export type UploadEdits = {
  crop?: {
    height?: number
    width?: number
    x?: number
    y?: number
  }
  focalPoint?: {
    x?: number
    y?: number
  }
}

export type DefaultEditViewProps = CollectionEditViewProps & {
  customHeader?: React.ReactNode
  disableRoutes?: boolean
  fieldTypes: FieldTypes
}
