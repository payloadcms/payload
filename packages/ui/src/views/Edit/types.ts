import type { SanitizedCollectionConfig } from 'payload/types'
import { FieldTypes } from 'payload/config'
import { EditViewProps } from '../types'

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

export type DefaultEditViewProps = EditViewProps & {
  customHeader?: React.ReactNode
  disableRoutes?: boolean
  fieldTypes: FieldTypes
}
