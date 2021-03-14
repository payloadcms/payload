import { CollectionConfig } from '../collections/config/types';
import isImage from './isImage';

const getThumbnail = (collection: CollectionConfig, doc: Record<string, unknown>): string | boolean => {
  const {
    upload: {
      staticURL,
      adminThumbnail,
    },
  } = collection;

  const {
    mimeType,
    sizes,
    filename,
  } = doc;

  if (isImage(mimeType as string)) {
    if (typeof adminThumbnail === 'function') {
      return adminThumbnail({ doc });
    }

    if (sizes?.[adminThumbnail]?.filename) {
      return `${staticURL}/${sizes[adminThumbnail].filename}`;
    }

    return `${staticURL}/${filename}`;
  }

  return false;
};

export default getThumbnail;
