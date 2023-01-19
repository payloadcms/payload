import { SanitizedCollectionConfig } from '../../../../../../collections/config/types';

export type Data = {
  filename: string
  mimeType: string
  filesize: number
}

export type Props = {
  data?: Data
  collection: SanitizedCollectionConfig
  adminThumbnail?: string
  mimeTypes?: string[];
  isEditing?: boolean
}
