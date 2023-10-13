import type { PayloadRequest } from '../../../../../express/types'
import type { RichTextField, Validate } from '../../../../../fields/config/types'
import type { CellComponentProps } from '../../../views/collections/List/Cell/types'

export type RichTextFieldProps<Value extends object, AdapterProps> = Omit<
  RichTextField<Value, AdapterProps>,
  'type'
> & {
  path?: string
}

export type RichTextAdapter<Value extends object = object, AdapterProps = any> = {
  CellComponent: React.FC<CellComponentProps<RichTextField<Value, AdapterProps>>>
  FieldComponent: React.FC<RichTextFieldProps<Value, AdapterProps>>
  afterReadPromise?: (data: {
    currentDepth?: number
    depth: number
    field: RichTextField<Value, AdapterProps>
    overrideAccess?: boolean
    req: PayloadRequest
    showHiddenFields: boolean
    siblingDoc: Record<string, unknown>
  }) => Promise<void> | null
  validate: Validate<Value, Value, unknown, RichTextField<Value, AdapterProps>>
}
