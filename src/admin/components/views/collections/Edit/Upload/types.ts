import { CollectionConfig } from '../../../../../../collections/config/types';

export type Data = {
  filename: string
  mimeType: string
  filesize: number
}

export type Props = {
  data?: Data
  collection: CollectionConfig
  adminThumbnail?: string
}
