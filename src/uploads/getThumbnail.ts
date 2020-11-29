import isImage from './isImage';
import { FileData } from './types';

const getThumbnail = (mimeType: string, staticURL: string, filename: string, sizes: FileData[], adminThumbnail: string): string | boolean => {
  if (isImage(mimeType)) {
    if (sizes?.[adminThumbnail]?.filename) {
      return `${staticURL}/${sizes[adminThumbnail].filename}`;
    }

    return `${staticURL}/${filename}`;
  }

  return false;
};

export default getThumbnail;
