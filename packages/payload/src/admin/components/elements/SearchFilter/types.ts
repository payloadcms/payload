import type { FieldAffectingData } from '../../../../fields/config/types';
import type { Where } from '../../../../types';

export type Props = {
  fieldLabel?: string,
  fieldName?: string,
  handleChange?: (where: Where) => void
  listSearchableFields?: FieldAffectingData[]
  modifySearchQuery?: boolean
}
