import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { deleteUploadFilesExclusiveToDocument } from './deleteUploadFilesExclusiveToDocument.js'
import { fileExists } from './fileExists.js'

describe('deleteUploadFilesExclusiveToDocument', () => {
  let staticDir: string
  let testDir: string

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-exclusive-uploads-'))
    staticDir = path.join(testDir, 'media')
    await fs.mkdir(staticDir)
  })

  afterEach(async () => {
    await fs.rm(testDir, { force: true, recursive: true })
  })

  it('should delete only source files that the retained document does not use', async () => {
    const deleteFiles = vi.fn()
    const sourceFilename = 'source.txt'
    const sourceSizeFilename = 'source-thumbnail.txt'
    const retainedFilename = 'retained.txt'

    await Promise.all(
      [sourceFilename, sourceSizeFilename, retainedFilename].map((filename) =>
        fs.writeFile(path.join(staticDir, filename), filename),
      ),
    )

    await deleteUploadFilesExclusiveToDocument({
      collectionConfig: {
        upload: {
          deleteFiles,
          staticDir,
        },
      } as unknown as SanitizedCollectionConfig,
      config: {} as SanitizedConfig,
      req: {
        context: {},
        payload: { db: {} },
        t: vi.fn(),
      } as unknown as PayloadRequest,
      retainedDoc: {
        filename: retainedFilename,
        sizes: { thumbnail: { filename: sourceSizeFilename } },
      },
      sourceDoc: {
        filename: sourceFilename,
        sizes: { thumbnail: { filename: sourceSizeFilename } },
      },
    })

    expect(await fileExists(path.join(staticDir, sourceFilename))).toBe(false)
    expect(await fileExists(path.join(staticDir, sourceSizeFilename))).toBe(true)
    expect(await fileExists(path.join(staticDir, retainedFilename))).toBe(true)
    expect(deleteFiles).toHaveBeenCalledWith({
      req: expect.any(Object),
      retainedDoc: {
        filename: retainedFilename,
        sizes: { thumbnail: { filename: sourceSizeFilename } },
      },
      sourceDoc: {
        filename: sourceFilename,
        sizes: { thumbnail: { filename: sourceSizeFilename } },
      },
    })
  })

  it('should let an upload adapter compare storage paths when filenames match', async () => {
    const deleteFiles = vi.fn()
    const sharedFilename = 'shared.txt'

    await fs.writeFile(path.join(staticDir, sharedFilename), sharedFilename)

    await deleteUploadFilesExclusiveToDocument({
      collectionConfig: {
        upload: {
          deleteFiles,
          staticDir,
        },
      } as unknown as SanitizedCollectionConfig,
      config: {} as SanitizedConfig,
      req: {
        context: {},
        payload: { db: {} },
        t: vi.fn(),
      } as unknown as PayloadRequest,
      retainedDoc: { filename: sharedFilename, prefix: 'retained' },
      sourceDoc: { filename: sharedFilename, prefix: 'source' },
    })

    expect(await fileExists(path.join(staticDir, sharedFilename))).toBe(true)
    expect(deleteFiles).toHaveBeenCalledWith({
      req: expect.any(Object),
      retainedDoc: { filename: sharedFilename, prefix: 'retained' },
      sourceDoc: { filename: sharedFilename, prefix: 'source' },
    })
  })
})
