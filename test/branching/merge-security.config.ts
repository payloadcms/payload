import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { mergeSecuritySpy } from './mergeSecuritySpy.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const mergeSecurityEditorEmail = 'merge-security-editor@example.com'
export const mergeSecurityCloudUploadsDirectory = path.resolve(
  dirname,
  'merge-security-cloud-uploads',
)
export const mergeSecurityCloudUploadsSlug = 'merge-security-cloud-uploads'
export const mergeSecurityPagesSlug = 'merge-security-pages'
export const mergeSecurityPostsSlug = 'merge-security-posts'
export const mergeSecurityUploadsDirectory = path.resolve(dirname, 'merge-security-uploads')
export const mergeSecurityUploadsSlug = 'merge-security-uploads'

export default buildConfigWithDefaults({
  config: {
    branching: true,
    collections: [
      {
        slug: mergeSecurityPagesSlug,
        access: {
          create: ({ req }) =>
            req.user?.email !== mergeSecurityEditorEmail || mergeSecuritySpy.allowPageCreate,
          read: ({ req }) => req.user?.email !== mergeSecurityEditorEmail,
          update: ({ req }) => req.user?.email !== mergeSecurityEditorEmail,
        },
        admin: { useAsTitle: 'title' },
        fields: [{ name: 'title', type: 'text' }],
        versions: false,
      },
      {
        slug: mergeSecurityPostsSlug,
        admin: { useAsTitle: 'title' },
        fields: [{ name: 'title', type: 'text' }],
        hooks: {
          beforeChange: [
            ({ data, operation }) => {
              if (operation === 'create' && data?.title === mergeSecuritySpy.rejectedPostTitle) {
                throw new Error('Rejected by create hook')
              }
            },
          ],
        },
        versions: false,
      },
      {
        slug: mergeSecurityCloudUploadsSlug,
        fields: [{ name: 'alt', type: 'text' }],
        upload: {
          staticDir: mergeSecurityCloudUploadsDirectory,
        },
        versions: false,
      },
      {
        slug: mergeSecurityUploadsSlug,
        access: {
          update: ({ req }) => {
            if (req.user?.email === mergeSecurityEditorEmail) {
              mergeSecuritySpy.uploadUpdateAccessChecks += 1
            }

            return true
          },
        },
        fields: [{ name: 'alt', type: 'text' }],
        hooks: {
          beforeChange: [
            async ({ data, req }) => {
              const nestedUploadID = mergeSecuritySpy.nestedUploadID

              if (
                !nestedUploadID ||
                mergeSecuritySpy.isUpdatingNestedUpload ||
                data.alt !== mergeSecuritySpy.nestedUploadTriggerAlt
              ) {
                return data
              }

              mergeSecuritySpy.isUpdatingNestedUpload = true

              try {
                await req.payload.update({
                  id: nestedUploadID,
                  collection: mergeSecurityUploadsSlug,
                  data: { alt: 'nested upload metadata' },
                  overrideAccess: false,
                  req,
                })
              } finally {
                mergeSecuritySpy.isUpdatingNestedUpload = false
              }

              return data
            },
          ],
        },
        upload: {
          deleteFiles: ({ retainedDoc, sourceDoc }) => {
            mergeSecuritySpy.uploadCleanupRetainedFilename = retainedDoc?.filename as
              | string
              | undefined
            mergeSecuritySpy.uploadCleanupSourceFilename = sourceDoc.filename as string | undefined
          },
          staticDir: mergeSecurityUploadsDirectory,
        },
        versions: { drafts: true },
      },
    ],
    plugins: [
      cloudStoragePlugin({
        collections: {
          [mergeSecurityCloudUploadsSlug]: {
            adapter: () => ({
              name: 'merge-security-cloud-storage',
              handleDelete: () => undefined,
              handleUpload: ({ file }) => {
                mergeSecuritySpy.cloudUploadContents.push(file.buffer.toString('utf8'))
              },
              staticHandler: () => new Response('Not found', { status: 404 }),
            }),
            disableLocalStorage: false,
          },
        },
      }),
    ],
  },
  suite: 'branching-merge-security',
})
