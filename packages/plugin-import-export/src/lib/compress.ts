import type { PaginatedDocs, Payload, PayloadRequest } from 'payload'

import archiver from 'archiver'
import { createWriteStream } from 'fs'
import fs from 'fs/promises'
import path from 'path'

import type { CollectionExport } from '../types.js'

import { exportsCollectionSlug } from '../constants.js'

export const compress = async (args: {
  destination: string // Should this optionally accept a write stream as well?
  payload: Payload
}): Promise<{ zipPath: string }> => {
  const { destination, payload } = args

  const rawData: PaginatedDocs<{
    collectionExports: CollectionExport[]
    createdAt: string
    id: string
  }> = await payload.db.find({
    collection: exportsCollectionSlug,
    limit: 1,
    req: {} as PayloadRequest,
    sort: 'createdAt',
  })

  const exportDate = rawData.docs[0].createdAt.split('T')[0]
  const exportDir = destination + `-${exportDate}`

  await fs.mkdir(exportDir, { recursive: true })

  for (const collectionExport of rawData.docs[0].collectionExports) {
    const collectionDir = path.join(exportDir, collectionExport.slug)
    await fs.mkdir(collectionDir, { recursive: true })

    const filePath = path.join(collectionDir, 'index.json')
    await fs.writeFile(filePath, JSON.stringify(collectionExport, null, 2))
  }

  // Now zip the top-level export directory
  const zipPath = `${exportDir}.zip`
  const output = createWriteStream(zipPath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  archive.on('error', (err) => {
    throw err
  })

  // Pipe the output to the zip file
  archive.pipe(output)

  // Append only the top-level directory (recursively adds its content)
  archive.directory(exportDir, false)

  // Finalize the archive
  await archive.finalize()

  console.log(`Zipped export to ${zipPath}`)

  return { zipPath }
}
