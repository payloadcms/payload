import type { PayloadRequest } from '../../../../../express/types'
import type { RichTextField, Validate } from '../../../../../fields/config/types'
import type { CellComponentProps } from '../../../views/collections/List/Cell/types'

export type RichTextFieldProps<
  Value extends object,
  AdapterProps,
  ExtraFieldProperties = {},
> = Omit<RichTextField<Value, AdapterProps, ExtraFieldProperties>, 'type'> & {
  path?: string
}

export type RichTextAdapter<
  Value extends object = object,
  AdapterProps = any,
  ExtraFieldProperties = {},
> = {
  CellComponent: React.FC<
    CellComponentProps<RichTextField<Value, AdapterProps, ExtraFieldProperties>>
  >
  FieldComponent: React.FC<RichTextFieldProps<Value, AdapterProps, ExtraFieldProperties>>
  afterReadPromise?: ({
    field,
    incomingEditorState,
    siblingDoc,
  }: {
    field: RichTextField<Value, AdapterProps, ExtraFieldProperties>
    incomingEditorState: Value
    siblingDoc: Record<string, unknown>
  }) => Promise<void> | null

  populationPromise?: (data: {
    currentDepth?: number
    depth: number
    field: RichTextField<Value, AdapterProps, ExtraFieldProperties>
    overrideAccess?: boolean
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
