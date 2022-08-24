import { TextField } from '../../../../fields/config/types';
import { Where } from '../../../../types';

export type Props = {
  fieldName?: string,
  fieldLabel?: string,
  modifySearchQuery?: boolean
  searchableTextFields?: TextField[]
  handleChange?: (where: Where) => void
}
