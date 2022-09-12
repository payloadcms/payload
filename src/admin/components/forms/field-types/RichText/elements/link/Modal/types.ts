import { Field } from '../../../../../../../../fields/config/types';
import { Fields } from '../../../../../Form/types';

export type Props = {
  modalSlug: string
  close: () => void
  handleModalSubmit: (fields: Fields, data: Record<string, unknown>) => void
  initialState?: Fields
  fieldSchema: Field[]
}
