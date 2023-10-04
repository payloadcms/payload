import type { Field, Fields } from 'payload/types'

export type Props = {
  drawerSlug: string
  fieldSchema: Field[]
  handleClose: () => void
  handleModalSubmit: (fields: Fields, data: Record<string, unknown>) => void
  initialState?: Fields
}
