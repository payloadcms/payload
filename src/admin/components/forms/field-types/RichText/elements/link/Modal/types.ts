import { Fields } from '../../../../../Form/types';

export type Props = {
  close: () => void
  handleModalSubmit: (fields: Fields, data: Record<string, unknown>) => void
  initialData?: Record<string, unknown>
}
