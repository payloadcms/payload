import type { SanitizedGlobalConfig } from 'payload/types'
import type { GlobalEditViewProps, FieldTypes } from '@payloadcms/ui'

export type IndexProps = {
  global: SanitizedGlobalConfig
}

export type DefaultGlobalViewProps = GlobalEditViewProps & {
  disableRoutes?: boolean
  fieldTypes: FieldTypes
}
