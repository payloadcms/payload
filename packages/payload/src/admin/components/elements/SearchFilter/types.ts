import { FieldAffectingData } from '../../../../fields/config/types.js';
import { Where } from '../../../../types/index.js';

export type Props = {
  fieldName?: string,
  fieldLabel?: string,
  modifySearchQuery?: boolean
  listSearchableFields?: FieldAffectingData[]
  handleChange?: (where: Where) => void
}
