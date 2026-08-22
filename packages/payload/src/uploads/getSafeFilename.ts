import sanitize from 'sanitize-filename'

import type { PayloadRequest } from '../types/index.js'

import { docWithFilenameExists } from './docWithFilenameExists.js'
import { fileExists } from './fileExists.js'

/**
 * Increments a filename by appending or incrementing a numeric suffix.
 * @example
 * incrementName('file.jpg') // 'file-1.jpg'
 * incrementName('file-1.jpg') // 'file-2.jpg'
 * incrementName('file-99.jpg') // 'file-100.jpg'
 */
export const incrementName = (name: string): string => {
  const extension = name.split('.').pop()
  const baseFilename = sanitize(name.substring(0, name.lastIndexOf('.')) || name)
  let incrementedName = baseFilename
  const regex = /(.*)-(\d+)$/
  const found = baseFilename.match(regex)
  if (found === null) {
    incrementedName += '-1'
  } else {
    const matchedName = found[1]
    const matchedNumber = found[2]
    const incremented = Number(matchedNumber) + 1
    incrementedName = `${matchedName}-${incremented}`
  }
  return `${incrementedName}.${extension}`
}

type Args = {
  collectionSlug: string
  desiredFilename: string
  /**
   * When provided, this document ID is excluded from the filename conflict
   * check. Pass the ID of the document being updated so it does not collide
   * with its own existing filename and receive a spurious `-1` suffix.
   */
  docId?: number | string
  prefix?: string
  req: PayloadRequest
  /**
   * Filesystem path where uploads are stored. When omitted, only the database
   * is consulted for filename conflicts - useful for cloud-storage adapters
   * that have no local filesystem.
   */
  staticPath?: string
}

/**
 * Generates a safe, unique filename by checking for conflicts in the database
 * and (when a `staticPath` is provided) the local filesystem. If a conflict
 * exists, it increments a numeric suffix until a unique name is found.
 *
 * @param args.collectionSlug - The slug of the upload collection
 * @param args.desiredFilename - The original filename to make safe
 * @param args.docId - ID of the document being updated; excluded from conflict checks
 * @param args.prefix - Optional prefix path for cloud storage adapters
 * @param args.req - The Payload request object
 * @param args.staticPath - The filesystem path where uploads are stored
 * @returns A unique filename that doesn't conflict with existing files
 *
 * @example
 * // If 'photo.jpg' already exists, returns 'photo-1.jpg'
 * const safeName = await getSafeFileName({
 *   collectionSlug: 'media',
 *   desiredFilename: 'photo.jpg',
 *   req,
 *   staticPath: '/uploads/media',
 * })
 */
export async function getSafeFileName({
  collectionSlug,
  desiredFilename,
  docId,
  prefix,
  req,
  staticPath,
}: Args): Promise<string> {
  let modifiedFilename = desiredFilename

  while (
    (await docWithFilenameExists({
      collectionSlug,
      docId,
      filename: modifiedFilename,
      path: staticPath ?? '',
      prefix,
      req,
    })) ||
    (staticPath ? await fileExists(`${staticPath}/${modifiedFilename}`) : false)
  ) {
    modifiedFilename = incrementName(modifiedFilename)
  }

  return modifiedFilename
}
