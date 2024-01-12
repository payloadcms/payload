import type { Fields } from '@payloadcms/ui'

import { type Field } from 'payload/types'

export interface Props {
  drawerSlug: string
  fieldSchema: Field[]
  handleModalSubmit: (fields: Fields, data: Record<string, unknown>) => void
  initialState?: Fields
}
