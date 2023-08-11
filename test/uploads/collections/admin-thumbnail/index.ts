import path from 'path';
import { CollectionConfig } from '../../../../src/collections/config/types';

type TypeWithFile = {
  filename: string;
  mimeType: string;
  filesize: number;
} & Record<string, unknown>

function docHasFilename(doc: Record<string, unknown>): doc is TypeWithFile {
  if (typeof doc === 'object' && 'filename' in doc) {
    return true;
  }
  return false;
}

export const adminThumbnailSrc = '/media/image-640x480.png';

export const AdminThumbnailCol: CollectionConfig = {
  slug: 'admin-thumbnail',
  upload: {
    staticDir: path.resolve(__dirname, '../../media'),
    adminThumbnail: ({ doc }) => {
      if (docHasFilename(doc)) {
        if (doc.mimeType.startsWith('image/')) {
          return null; // Fallback to default admin thumbnail if image
        }
        return adminThumbnailSrc; // Use custom thumbnail if not image
      }
      return null;
    },
  },
  fields: [],
};

export default AdminThumbnailCol;
