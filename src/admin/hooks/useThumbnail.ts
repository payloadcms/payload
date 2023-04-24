import { useConfig } from '../components/utilities/Config';
import { SanitizedCollectionConfig } from '../../collections/config/types';
import isImage from '../../uploads/isImage';

const absoluteURLPattern = new RegExp('^(?:[a-z]+:)?//', 'i');
const base64Pattern = new RegExp(/^data:image\/[a-z]+;base64,/);

const useThumbnail = (collection: SanitizedCollectionConfig, doc: Record<string, unknown>): string | false => {
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
    url,
  } = doc;

  const { serverURL } = useConfig();

  if (isImage(mimeType as string)) {
    if (typeof adminThumbnail === 'undefined' && url) {
      return url as string;
    }

    if (typeof adminThumbnail === 'function') {
      const thumbnailURL = adminThumbnail({ doc });

      if (absoluteURLPattern.test(thumbnailURL) || base64Pattern.test(thumbnailURL)) {
        return thumbnailURL;
      }

      return `${serverURL}${thumbnailURL}`;
    }

    if (sizes?.[adminThumbnail]?.url) {
      return sizes[adminThumbnail].url;
    }

    if (sizes?.[adminThumbnail]?.filename) {
      return `${serverURL}${staticURL}/${sizes[adminThumbnail].filename}`;
    }

    return `${serverURL}${staticURL}/${filename}`;
  }

  return false;
};

export default useThumbnail;
