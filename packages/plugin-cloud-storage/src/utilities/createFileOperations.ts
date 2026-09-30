import type { CollectionConfig, FileData, UploadConfig } from 'payload'

import fs from 'node:fs/promises'
import path from 'node:path'
import { createManagedFileManifest } from 'payload/internal'

import type { GeneratedAdapter } from '../types.js'

import { buildPrefixWithObjectKey } from './buildPrefixWithObjectKey.js'
import { buildUploadStoragePathData } from './buildStoragePathData.js'

type Args = {
  adapter: GeneratedAdapter
  collection: CollectionConfig
  collectionPrefix?: string
  useCompositePrefixes?: boolean
}

export const createFileOperations = ({
  adapter,
  collection,
  collectionPrefix,
  useCompositePrefixes,
}: Args): NonNullable<UploadConfig['fileOperations']> => {
  const storageBackendId = `${adapter.name}:${collection.slug}`

  return {
    copy: async ({ from, req, to, trackStagedObject }) => {
      await adapter.copyFile({
        collection: req.payload.collections[collection.slug]!.config,
        from,
        req,
        to,
      })
      trackStagedObject({
        key: to,
        remove: async () => {
          await adapter.handleDelete({
            collection,
            doc: {} as never,
            filename: path.posix.basename(to),
            req,
            storageFilePath: to,
          })
        },
        storageBackendId,
      })
    },
    stage: async ({ data, files, req, trackStagedObject }) => {
      const docPrefix = buildPrefixWithObjectKey({
        objectKey: typeof data._objectKey === 'string' ? data._objectKey : undefined,
        prefix: typeof data.prefix === 'string' ? data.prefix : undefined,
      })
      const dataForUpload = { ...data, prefix: docPrefix }
      const keyByFilename = new Map<string, string>()
      let metadata: Record<string, unknown> = {}
      const verifiedOriginal = req.context?._payloadVerifiedProviderOriginal as
        | { filename: string; key: string }
        | undefined

      for (const file of files) {
        const filename = path.basename(file.path)
        const storageFilePath = buildUploadStoragePathData({
          collectionPrefix,
          docPrefix,
          filename,
          useCompositePrefixes,
        }).storageFilePath

        if (keyByFilename.has(filename)) {
          throw new Error(`Duplicate managed cloud filename: ${filename}`)
        }

        keyByFilename.set(filename, storageFilePath)
        const buffer =
          'buffer' in file
            ? file.buffer
            : adapter.supportsTempFiles
              ? Buffer.alloc(0)
              : await fs.readFile(file.sourcePath)
        const uploadFile = {
          buffer,
          filename,
          filesize: 'buffer' in file ? file.buffer.length : (await fs.stat(file.sourcePath)).size,
          mimeType: getMimeType({ data, filename }),
          ...('sourcePath' in file ? { tempFilePath: file.sourcePath } : {}),
        }

        // A new object folder is allocated for every server upload, so an interrupted
        // provider write can be removed without touching an earlier revision.
        trackStagedObject({
          key: storageFilePath,
          remove: async () => {
            await adapter.handleDelete({
              collection,
              doc: data as never,
              filename,
              req,
              storageFilePath,
            })
          },
          storageBackendId,
        })

        const result = await adapter.handleUpload({
          collection,
          data: dataForUpload,
          file: uploadFile,
          req,
          storageFilePath,
        })

        if (result && typeof result === 'object') {
          metadata = { ...metadata, ...result }
        }
      }

      delete metadata.prefix
      delete metadata._objectKey
      delete metadata._managedFiles

      const references: Parameters<typeof createManagedFileManifest>[0]['references'] = []
      const original = data.original as { filename?: string } | undefined

      if (original?.filename && keyByFilename.has(original.filename)) {
        references.push({
          key: keyByFilename.get(original.filename)!,
          role: { type: 'original' },
          storageBackendId,
        })
      } else if (verifiedOriginal) {
        references.push({
          key: verifiedOriginal.key,
          role: { type: 'original' },
          storageBackendId,
        })
        if (data.filename === verifiedOriginal.filename) {
          references.push({
            key: verifiedOriginal.key,
            role: { type: 'default' },
            storageBackendId,
          })
        }
      } else {
        const retainedOriginal = (data._managedFiles as FileData['_managedFiles'])?.find(
          (file) =>
            file.storageBackendId === storageBackendId &&
            file.roles.some((role) => role.type === 'original'),
        )
        if (retainedOriginal) {
          references.push({
            key: retainedOriginal.key,
            role: { type: 'original' },
            storageBackendId,
          })
          if (data.filename === original?.filename) {
            references.push({
              key: retainedOriginal.key,
              role: { type: 'default' },
              storageBackendId,
            })
          }
        }
      }
      if (typeof data.filename === 'string' && keyByFilename.has(data.filename)) {
        references.push({
          key: keyByFilename.get(data.filename)!,
          role: { type: 'default' },
          storageBackendId,
        })
      }
      if (data.sizes && typeof data.sizes === 'object') {
        for (const [sizeKey, size] of Object.entries(data.sizes)) {
          const filename = (size as { filename?: string } | null)?.filename
          if (filename && keyByFilename.has(filename)) {
            references.push({
              key: keyByFilename.get(filename)!,
              role: { type: 'size', sizeKey },
              storageBackendId,
            })
          }
        }
      }

      return { managedFiles: createManagedFileManifest({ references }), metadata }
    },
  }
}

const getMimeType = ({
  data,
  filename,
}: {
  data: Record<string, unknown>
  filename: string
}): string => {
  if (data.original && typeof data.original === 'object') {
    const original = data.original as { filename?: string; mimeType?: string }
    if (original.filename === filename && original.mimeType) {
      return original.mimeType
    }
  }
  if (data.sizes && typeof data.sizes === 'object') {
    for (const size of Object.values(data.sizes)) {
      const candidate = size as { filename?: string; mimeType?: string } | null
      if (candidate?.filename === filename && candidate.mimeType) {
        return candidate.mimeType
      }
    }
  }
  return typeof data.mimeType === 'string' ? data.mimeType : 'application/octet-stream'
}
