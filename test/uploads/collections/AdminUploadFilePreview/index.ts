import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { adminUploadFilePreviewMapSlug, adminUploadFilePreviewSingleSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const AdminUploadFilePreviewSingle: CollectionConfig = {
  slug: adminUploadFilePreviewSingleSlug,
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
    admin: {
      components: {
        filePreview:
          '/collections/AdminUploadFilePreview/components/SingleFilePreview/index.js#SingleFilePreviewRSC',
      },
    },
  },
  fields: [],
  versions: false,
}

export const AdminUploadFilePreviewMap: CollectionConfig = {
  slug: adminUploadFilePreviewMapSlug,
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
    admin: {
      components: {
        filePreview: {
          'audio/*':
            '/collections/AdminUploadFilePreview/components/AudioFilePreview/index.js#AudioFilePreviewRSC',
          'application/pdf':
            '/collections/AdminUploadFilePreview/components/PdfFilePreview/index.js#PdfFilePreviewRSC',
          'video/*':
            '/collections/FilePreview/components/FilePreview/index.js#FilePreviewComponent',
        },
      },
    },
  },
  fields: [],
  versions: false,
}
