import type { Field } from 'payload'
import type { Fields } from 'payload'

export type Props = {
  drawerSlug: string
  fieldSchema: Field[]
  handleClose: () => void
  handleModalSubmit: (fields: Fields, data: Record<string, unknown>) => void
  initialState?: Fields
}
