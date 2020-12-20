import { FileSizes } from '../../../../uploads/types';

export type Props = {
  filename: string,
  mimeType: string,
  filesize: number,
  staticURL: string,
  width?: number,
  height?: number,
  sizes?: FileSizes,
  adminThumbnail?: string,
  handleRemove?: () => void,
}
