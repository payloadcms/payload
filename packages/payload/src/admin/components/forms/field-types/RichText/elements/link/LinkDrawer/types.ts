import type { Field } from '../../../../../../../../fields/config/types'
import type { Fields } from '../../../../../Form/types'

export type Props = {
  drawerSlug: string
  fieldSchema: Field[]
  handleClose: () => void
  handleModalSubmit: (fields: Fields, data: Record<string, unknown>) => void
  initialState?: Fields
}
