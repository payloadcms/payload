import type { JSONSchema4 } from 'json-schema'

import type { RequestContext } from '../../dist'
import type { PayloadRequest } from '../express/types'
import type { RichTextField, Validate } from '../fields/config/types'
import type { CellComponentProps } from './elements/Cell'

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
    field,
    isRequired,
  }: {
    field: RichTextField<Value, AdapterProps, ExtraFieldProperties>
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
