import type { JSONSchema4 } from 'json-schema'

import type { SanitizedConfig } from '../config/types.d.ts'
import type { Field, RichTextField, Validate } from '../fields/config/types.d.ts'
import type { PayloadRequest, RequestContext } from '../types/index.d.ts'
import type { CellComponentProps } from './elements/Cell.d.ts'

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
    schemaPath: string
  }) => Map<string, React.ReactNode>
  generateSchemaMap?: (args: {
    config: SanitizedConfig
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
> = RichTextAdapterBase<Value, AdapterProps, ExtraFieldProperties> &
  (
    | {
        CellComponent: React.FC<
          CellComponentProps<RichTextField<Value, AdapterProps, ExtraFieldProperties>>
        >
        FieldComponent: React.FC<RichTextFieldProps<Value, AdapterProps, ExtraFieldProperties>>
      }
    | {
        LazyCellComponent: () => Promise<
          React.FC<CellComponentProps<RichTextField<Value, AdapterProps, ExtraFieldProperties>>>
        >
        LazyFieldComponent: () => Promise<
          React.FC<RichTextFieldProps<Value, AdapterProps, ExtraFieldProperties>>
        >
      }
  )
