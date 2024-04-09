import type { I18n } from '@payloadcms/translations'
import type { JSONSchema4 } from 'json-schema'

import type { SanitizedConfig } from '../config/types.js'
import type { Field, RichTextField, Validate } from '../fields/config/types.js'
import type { PayloadRequest, RequestContext } from '../types/index.js'

export type RichTextFieldProps<
  Value extends object,
  AdapterProps,
  ExtraFieldProperties = {},
> = Omit<RichTextField<Value, AdapterProps, ExtraFieldProperties>, 'type'> & {
  path?: string
}

type RichTextAdapterBase<
  Value extends object = object,
  AdapterProps = any,
  ExtraFieldProperties = {},
> = {
  afterReadPromise?: ({
    field,
    incomingEditorState,
    siblingDoc,
  }: {
    field: RichTextField<Value, AdapterProps, ExtraFieldProperties>
    incomingEditorState: Value
    siblingDoc: Record<string, unknown>
  }) => Promise<void> | null
  generateComponentMap: (args: {
    config: SanitizedConfig
    i18n: I18n
    schemaPath: string
  }) => Map<string, React.ReactNode>
  generateSchemaMap?: (args: {
    config: SanitizedConfig
    i18n: I18n
    schemaMap: Map<string, Field[]>
    schemaPath: string
  }) => Map<string, Field[]>
  outputSchema?: ({
    collectionIDFieldTypes,
    config,
    field,
    interfaceNameDefinitions,
    isRequired,
  }: {
    collectionIDFieldTypes: { [key: string]: 'number' | 'string' }
    config?: SanitizedConfig
    field: RichTextField<Value, AdapterProps, ExtraFieldProperties>
    /**
     * Allows you to define new top-level interfaces that can be re-used in the output schema.
     */
    interfaceNameDefinitions: Map<string, JSONSchema4>
    isRequired: boolean
  }) => JSONSchema4
  populationPromise?: (data: {
    context: RequestContext
    currentDepth?: number
    depth: number
    field: RichTextField<Value, AdapterProps, ExtraFieldProperties>
    findMany: boolean
    flattenLocales: boolean
    overrideAccess?: boolean
    populationPromises: Promise<void>[]
    req: PayloadRequest
    showHiddenFields: boolean
    siblingDoc: Record<string, unknown>
  }) => Promise<void> | null
  validate: Validate<
    Value,
    Value,
    unknown,
    RichTextField<Value, AdapterProps, ExtraFieldProperties>
  >
}

export type RichTextAdapter<
  Value extends object = object,
  AdapterProps = any,
  ExtraFieldProperties = {},
> = RichTextAdapterBase<Value, AdapterProps, ExtraFieldProperties> & {
  CellComponent: React.FC<any>
  FieldComponent: React.FC<RichTextFieldProps<Value, AdapterProps, ExtraFieldProperties>>
}
