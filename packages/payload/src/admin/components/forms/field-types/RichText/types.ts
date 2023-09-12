import type { PayloadRequest } from '../../../../../express/types'
import type { RichTextField } from '../../../../../fields/config/types'

export type Props = Omit<RichTextField, 'type'> & {
  path?: string
}

export type RichTextAdapter<AdapterProps = unknown> = {
  afterReadPromise?: (data: {
    currentDepth?: number
    depth: number
    field: RichTextField<AdapterProps>
    overrideAccess?: boolean
    req: PayloadRequest
    showHiddenFields: boolean
    siblingDoc: Record<string, unknown>
  }) => Promise<void> | null
  component: React.FC<Props>
}
