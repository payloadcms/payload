import type { SanitizedGlobalConfig } from 'payload/types'
import { GlobalEditViewProps } from '../types'
import { FieldTypes } from '../../forms/field-types'

export type IndexProps = {
  global: SanitizedGlobalConfig
}

export type DefaultGlobalViewProps = GlobalEditViewProps & {
  disableRoutes?: boolean
  fieldTypes: FieldTypes
}
