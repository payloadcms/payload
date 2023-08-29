import type { Field } from '../../../../../../../../fields/config/types.js'
import type { Fields } from '../../../../../Form/types.js'

export type Props = {
  drawerSlug: string
  fieldSchema: Field[]
  handleClose: () => void
  handleModalSubmit: (fields: Fields, data: Record<string, unknown>) => void
  initialState?: Fields
}
