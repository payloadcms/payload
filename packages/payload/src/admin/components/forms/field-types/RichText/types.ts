import type { JSONSchema4 } from 'json-schema'
import type { SanitizedConfig } from 'payload/config'

import type { PayloadRequest } from '../../../../../express/types'
import type { RequestContext } from '../../../../../express/types'
import type { RichTextField, Validate } from '../../../../../fields/config/types'
import type { Payload } from '../../../../../payload'
import type { CellComponentProps } from '../../../views/collections/List/Cell/types'

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
  outputSchema?: ({
    collectionIDFieldTypes,
    config,
    field,
    interfaceNameDefinitions,
    isRequired,
    payload,
  }: {
    collectionIDFieldTypes: { [key: string]: 'number' | 'string' }
    config?: SanitizedConfig
    field: RichTextField<Value, AdapterProps, ExtraFieldProperties>
    /**
     * Allows you to define new top-level interfaces that can be re-used in the output schema.
     */
    interfaceNameDefinitions: Map<string, JSONSchema4>
    isRequired: boolean
    payload?: Payload
  }) => JSONSchema4
  populationPromise?: (data: {
    context: RequestContext
    currentDepth?: number
    depth: number
    draft: boolean
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
