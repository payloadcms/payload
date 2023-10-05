import type { PayloadRequest } from '../../../../../express/types'
import type { RichTextField } from '../../../../../fields/config/types'
import type { CellComponentProps } from '../../../views/collections/List/Cell/types'

export type RichTextFieldProps<AdapterProps = unknown> = Omit<
  RichTextField<AdapterProps>,
  'type'
> & {
  path?: string
}

export type RichTextAdapter<AdapterProps = unknown> = {
  CellComponent: React.FC<CellComponentProps<RichTextField<AdapterProps>>>
  FieldComponent: React.FC<RichTextFieldProps<AdapterProps>>
  afterReadPromise?: (data: {
    currentDepth?: number
    depth: number
    field: RichTextField<AdapterProps>
    overrideAccess?: boolean
    req: PayloadRequest
    showHiddenFields: boolean
    siblingDoc: Record<string, unknown>
  }) => Promise<void> | null
}
