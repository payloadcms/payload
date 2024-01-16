import type { FormState } from '@payloadcms/ui'

import { type Field } from 'payload/types'

export interface Props {
  drawerSlug: string
  fieldSchema: Field[]
  handleModalSubmit: (fields: FormState, data: Record<string, unknown>) => void
  initialState?: FormState
}
