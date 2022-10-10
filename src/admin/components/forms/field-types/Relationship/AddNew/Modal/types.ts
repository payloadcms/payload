import { SanitizedCollectionConfig } from '../../../../../../../collections/config/types';

export type Props = {
  modalSlug: string
  modalCollection: SanitizedCollectionConfig
  onSave: (json: Record<string, unknown>) => void
}
