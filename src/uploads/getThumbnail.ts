import isImage from './isImage';

const getThumbnail = (mimeType, staticURL, filename, sizes, adminThumbnail): string | boolean => {
  if (isImage(mimeType)) {
    if (sizes?.[adminThumbnail]?.filename) {
      return `${staticURL}/${sizes[adminThumbnail].filename}`;
    }

    return `${staticURL}/${filename}`;
  }

  return false;
};

export default getThumbnail;
