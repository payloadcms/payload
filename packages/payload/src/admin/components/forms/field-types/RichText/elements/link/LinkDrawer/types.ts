import { Field } from '../../../../../../../../fields/config/types.js';
import { Fields } from '../../../../../Form/types.js';

export type Props = {
  drawerSlug: string
  handleClose: () => void
  handleModalSubmit: (fields: Fields, data: Record<string, unknown>) => void
  initialState?: Fields
  fieldSchema: Field[]
}
