import type { CollectionConfig, ImageSize, JsonObject, UploadConfig } from 'payload'

import fs from 'node:fs/promises'
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { deepCopyObjectSimple, generatePayloadFileURL } from 'payload'

import type { GeneratedAdapter, GenerateFileURL } from '../types.js'

import { buildPrefixWithObjectKey } from './buildPrefixWithObjectKey.js'
import {
  buildStoragePathData,
  buildUploadPrefix,
  buildUploadStoragePathData,
} from './buildStoragePathData.js'

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
    hasLegacyFile: async ({ doc, req }) => {
      if (typeof doc.filename !== 'string' || typeof doc.url !== 'string') {
        return false
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
        return false
      }
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
              return false
            }
          }
        }
      }
      return true
    },
    resolveStorageKey: ({ _objectKey, filename, prefix }) =>
      buildStoragePathData({
        collectionPrefix,
        docPrefix: buildPrefixWithObjectKey({ objectKey: _objectKey, prefix }),
        filename,
        useCompositePrefixes,
      }).storageFilePath,
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
        })
      },
    }),
    stage: async ({ data, files, req, trackStagedObject }) => {
      const uploadedNames = new Set<string>()
      const metadata: Record<string, unknown> = {}
      const verifiedOriginal = req.context?._payloadVerifiedProviderOriginal as
        | { filename: string }
        | undefined
      for (const file of files) {
        const filename = path.basename(file.path)
        const representations: Record<string, unknown>[] = [data]
        if (data.original && typeof data.original === 'object') {
          representations.push(data.original as Record<string, unknown>)
        }
        if (data.variants && typeof data.variants === 'object') {
          representations.push(
            ...Object.values(data.variants).filter(
              (value): value is Record<string, unknown> =>
                Boolean(value) && typeof value === 'object',
            ),
          )
        }
        const destinations = representations.filter((value) => value.filename === filename)
        // Provider-direct uploads already placed the source object at its verified location.
        // A bounded content probe can still appear in files, but it is not a representation
        // Payload should upload again.
        if (!destinations.length && verifiedOriginal) {
          continue
        }
        if (!destinations.length) {
          throw new Error(`No stored representation describes ${filename}`)
        }
        const location = destinations[0]!
        const prefixData = buildUploadPrefix({
          collectionPrefix,
          docPrefix: typeof location.prefix === 'string' ? location.prefix : undefined,
          useCompositePrefixes,
        })
        const prefix = useCompositePrefixes
          ? prefixData.sanitizedDocPrefix
          : prefixData.uploadPrefix
        const objectKey = typeof location._objectKey === 'string' ? location._objectKey : undefined
        for (const destination of destinations) {
          destination.prefix = prefix
          destination._objectKey = objectKey
        }
        const docPrefix = buildPrefixWithObjectKey({ objectKey, prefix })
        const dataForUpload = { ...data, prefix: docPrefix }
        const storageFilePath = buildUploadStoragePathData({
          collectionPrefix,
          docPrefix,
          filename,
          useCompositePrefixes,
        }).storageFilePath

        if (uploadedNames.has(filename)) {
          throw new Error(`Duplicate managed cloud filename: ${filename}`)
        }

        uploadedNames.add(filename)
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
        })

        const dataBeforeUpload = deepCopyObjectSimple(dataForUpload as JsonObject)
        const result = await adapter.handleUpload({
          collection,
          data: dataForUpload,
          file: uploadFile,
          req,
          storageFilePath,
        })

        if (result && typeof result === 'object') {
          // Adapters may return the entire input document, including fields made stale by this upload.
          for (const [key, value] of Object.entries(result)) {
            if (!isDeepStrictEqual(value, dataBeforeUpload[key])) {
              metadata[key] = value
            }
          }
        }
      }

      delete metadata.prefix
      delete metadata._objectKey
      return { metadata }
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
