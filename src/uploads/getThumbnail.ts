import imageMIMETypes from './imageMIMETypes';

const getThumbnail = (mimeType, staticURL, filename, sizes, adminThumbnail) => {
  if (imageMIMETypes.indexOf(mimeType) > -1) {
    if (sizes?.[adminThumbnail]?.filename) {
      return `${staticURL}/${sizes[adminThumbnail].filename}`;
    }

    return `${staticURL}/${filename}`;
  }

  return false;
};

export default getThumbnail;
