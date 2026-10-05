import type { CollectionConfig, FileData, ImageSize, UploadConfig } from 'payload'

import fs from 'node:fs/promises'
import path from 'node:path'
import { generatePayloadFileURL } from 'payload'
import { createManagedFileManifest } from 'payload/internal'

import type { GeneratedAdapter, GenerateFileURL } from '../types.js'

import { buildPrefixWithObjectKey } from './buildPrefixWithObjectKey.js'
import { buildStoragePathData, buildUploadStoragePathData } from './buildStoragePathData.js'

type Args = {
  adapter: GeneratedAdapter
  collection: CollectionConfig
  collectionPrefix?: string
  disablePayloadAccessControl?: boolean
  generateFileURL?: GenerateFileURL
  useCompositePrefixes?: boolean
}

export const createFileOperations = ({
  adapter,
  collection,
  collectionPrefix,
  disablePayloadAccessControl,
  generateFileURL,
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
    delete: async ({ key, req }) => {
      await adapter.handleDelete({
        collection,
        doc: {} as never,
        filename: path.posix.basename(key),
        req,
        storageFilePath: key,
      })
    },
    getLegacyManifest: async ({ doc, req }) => {
      if (typeof doc.filename !== 'string' || typeof doc.url !== 'string') {
        return []
      }

      const docPrefix = typeof doc.prefix === 'string' ? doc.prefix : undefined
      const objectFolder = buildPrefixWithObjectKey({
        objectKey: typeof doc._objectKey === 'string' ? doc._objectKey : undefined,
        prefix: docPrefix,
      })
      const expectedURL = async ({ filename, size }: { filename: string; size?: ImageSize }) => {
        if (generateFileURL) {
          return generateFileURL({ collection, filename, prefix: objectFolder, size })
        }
        if (disablePayloadAccessControl && adapter.generateURL) {
          return adapter.generateURL({ collection, data: doc, filename, prefix: objectFolder })
        }
        return generatePayloadFileURL({
          collectionSlug: collection.slug,
          config: req.payload.config as unknown as Parameters<
            typeof generatePayloadFileURL
          >[0]['config'],
          filename,
          relative: true,
        })
      }
      if (doc.url !== (await expectedURL({ filename: doc.filename }))) {
        return []
      }
      const references: Parameters<typeof createManagedFileManifest>[0]['references'] = []
      const add = ({
        filename,
        role,
      }: {
        filename: string
        role: (typeof references)[number]['role']
      }) => {
        references.push({
          key: buildStoragePathData({
            collectionPrefix,
            docPrefix,
            filename,
            useCompositePrefixes,
          }).storageFilePath,
          role,
          storageBackendId,
        })
      }

      add({ filename: doc.filename, role: { type: 'default' } })
      add({ filename: doc.filename, role: { type: 'original' } })
      if (doc.variants && typeof doc.variants === 'object' && !Array.isArray(doc.variants)) {
        for (const [sizeKey, size] of Object.entries(doc.variants)) {
          if (
            size &&
            typeof size === 'object' &&
            'filename' in size &&
            typeof size.filename === 'string'
          ) {
            const imageSize = req.payload.collections[
              collection.slug
            ]?.config.upload.variants?.find(({ name }) => name === sizeKey)
            if (
              !('url' in size) ||
              typeof size.url !== 'string' ||
              size.url !== (await expectedURL({ filename: size.filename, size: imageSize }))
            ) {
              return []
            }
            add({ filename: size.filename, role: { type: 'size', sizeKey } })
          }
        }
      }
      return createManagedFileManifest({ references })
    },
    ...(adapter.moveFile && {
      move: async ({ from, req, to, trackStagedObject }) => {
        await adapter.moveFile!({
          collection: req.payload.collections[collection.slug]!.config,
          from,
          req,
          to,
        })
        trackStagedObject({
          key: to,
          remove: () =>
            adapter.moveFile!({
              collection: req.payload.collections[collection.slug]!.config,
              from: to,
              req,
              to: from,
            }),
          storageBackendId,
        })
      },
    }),
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
      if (data.variants && typeof data.variants === 'object') {
        for (const [sizeKey, size] of Object.entries(data.variants)) {
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
    storageBackendId,
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
  if (data.variants && typeof data.variants === 'object') {
    for (const size of Object.values(data.variants)) {
      const candidate = size as { filename?: string; mimeType?: string } | null
      if (candidate?.filename === filename && candidate.mimeType) {
        return candidate.mimeType
      }
    }
  }
  return typeof data.mimeType === 'string' ? data.mimeType : 'application/octet-stream'
}
