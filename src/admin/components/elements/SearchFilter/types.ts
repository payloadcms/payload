import { Where } from '../../../../types';

export type Props = {
  fieldName?: string,
  fieldLabel?: string,
  modifySearchQuery?: boolean
  handleChange?: (where: Where) => void
}
