import type { FieldAffectingData } from '../../../../fields/config/types.js';
import type { Where } from '../../../../types/index.js';

export type Props = {
  fieldLabel?: string,
  fieldName?: string,
  handleChange?: (where: Where) => void
  listSearchableFields?: FieldAffectingData[]
  modifySearchQuery?: boolean
}
