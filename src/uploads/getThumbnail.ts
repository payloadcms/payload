import isImage from './isImage';
import { FileSizes } from './types';

const getThumbnail = (mimeType: string, staticURL: string, filename: string, sizes: FileSizes, adminThumbnail: string): string | boolean => {
  if (isImage(mimeType)) {
    if (sizes?.[adminThumbnail]?.filename) {
      return `${staticURL}/${sizes[adminThumbnail].filename}`;
    }

    return `${staticURL}/${filename}`;
  }

  return false;
};

export default getThumbnail;
