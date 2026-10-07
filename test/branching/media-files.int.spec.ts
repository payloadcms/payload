import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { branchesSlug, versionedMediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const versionedMediaDirectory = path.resolve(dirname, 'versioned-media')

type UploadVersionData = {
  filename?: null | string
  original?: {
    filename?: null | string
  } | null
}

const getStoredVersionFilename = ({ version }: { version: unknown }): string => {
  const uploadVersion = version as UploadVersionData
  const storedFilename = uploadVersion.original?.filename ?? uploadVersion.filename

  expect(storedFilename).toBeTypeOf('string')

  return storedFilename!
}

test.suite('Branching versioned media files', { config: './config.ts' }, () => {
  test.afterEach(async () => {
    await rm(versionedMediaDirectory, { force: true, recursive: true })
  })

  test('should retain the main and branch files in version history after merging', async ({
    payload,
  }) => {
    const branchSlug = 'versioned-media-work'
    const originalFileData = await readFile(path.resolve(dirname, '../uploads/image.png'))
    const replacementFileData = await readFile(path.resolve(dirname, '../uploads/image.jpg'))

    await payload.create({
      collection: branchesSlug,
      data: { name: 'Versioned media work', slug: branchSlug },
    })

    const original = await payload.create({
      collection: versionedMediaSlug,
      data: { alt: 'Original banner' },
      file: {
        data: originalFileData,
        mimetype: 'image/png',
        name: 'banner.png',
        size: originalFileData.length,
      },
      overrideAccess: true,
    })
    const mainVersionsBeforeMerge = await payload.findVersions({
      collection: versionedMediaSlug,
      overrideAccess: true,
      pagination: false,
      where: { parent: { equals: original.id } },
    })
    const originalMainVersion = mainVersionsBeforeMerge.docs[0]!

    const replacement = await payload.update({
      id: original.id,
      branch: branchSlug,
      collection: versionedMediaSlug,
      data: { alt: 'Branch replacement banner' },
      file: {
        data: replacementFileData,
        mimetype: 'image/jpeg',
        name: 'banner.jpg',
        size: replacementFileData.length,
      },
      overrideAccess: true,
    })
    const [onMainBeforeMerge, onBranchBeforeMerge] = await Promise.all([
      payload.findByID({
        id: original.id,
        branch: false,
        collection: versionedMediaSlug,
        overrideAccess: true,
      }),
      payload.findByID({
        id: original.id,
        branch: branchSlug,
        collection: versionedMediaSlug,
        overrideAccess: true,
      }),
    ])

    expect(onMainBeforeMerge.filename).toBe(original.filename)
    expect(onBranchBeforeMerge.filename).toBe(replacement.filename)
    expect(onBranchBeforeMerge.filename).not.toBe(onMainBeforeMerge.filename)
    await expect(
      readFile(path.resolve(versionedMediaDirectory, onMainBeforeMerge.filename!)),
    ).resolves.toEqual(originalFileData)
    await expect(
      readFile(path.resolve(versionedMediaDirectory, onBranchBeforeMerge.filename!)),
    ).resolves.toEqual(replacementFileData)

    await payload.branches.merge({ branch: branchSlug })

    const [onMainAfterMerge, mainVersionsAfterMerge] = await Promise.all([
      payload.findByID({
        id: original.id,
        branch: false,
        collection: versionedMediaSlug,
        overrideAccess: true,
      }),
      payload.findVersions({
        collection: versionedMediaSlug,
        overrideAccess: true,
        pagination: false,
        where: { parent: { equals: original.id } },
      }),
    ])
    const versionIDsBeforeMerge = new Set(
      mainVersionsBeforeMerge.docs.map((version) => String(version.id)),
    )
    const mergedMainVersion = mainVersionsAfterMerge.docs.find(
      (version) => !versionIDsBeforeMerge.has(String(version.id)),
    )
    const originalMainVersionAfterMerge = mainVersionsAfterMerge.docs.find(
      (version) => String(version.id) === String(originalMainVersion.id),
    )

    expect(onMainAfterMerge.filename).toBe(replacement.filename)
    expect(mainVersionsAfterMerge.docs).toHaveLength(mainVersionsBeforeMerge.docs.length + 1)
    expect(mergedMainVersion).toBeDefined()
    expect(originalMainVersionAfterMerge).toBeDefined()

    const mergedVersionFilename = getStoredVersionFilename({ version: mergedMainVersion!.version })
    const originalVersionFilename = getStoredVersionFilename({
      version: originalMainVersionAfterMerge!.version,
    })

    expect(mergedVersionFilename).not.toBe(originalVersionFilename)
    await expect(
      readFile(path.resolve(versionedMediaDirectory, mergedVersionFilename)),
    ).resolves.toEqual(replacementFileData)
    await expect(
      readFile(path.resolve(versionedMediaDirectory, originalVersionFilename)),
    ).resolves.toEqual(originalFileData)
  })
})
