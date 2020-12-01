import { FileSizes } from '../../../../uploads/types';

export type Props = {
  filename: string,
  sizes?: FileSizes
  adminThumbnail?: string,
  mimeType?: string,
  staticURL: string,
  size?: 'small' | 'medium' | 'large' | 'expand',
}
