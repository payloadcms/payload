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
        name: 'banner.png',
        data: originalFileData,
        mimetype: 'image/png',
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

    await payload.update({
      id: original.id,
      branch: branchSlug,
      collection: versionedMediaSlug,
      data: { alt: 'Branch metadata edit' },
      overrideAccess: true,
    })

    const replacement = await payload.update({
      id: original.id,
      branch: branchSlug,
      collection: versionedMediaSlug,
      data: { alt: 'Branch replacement banner' },
      file: {
        name: 'banner.jpg',
        data: replacementFileData,
        mimetype: 'image/jpeg',
        size: replacementFileData.length,
      },
      overrideAccess: true,
    })
    const branchVersionsBeforeMerge = await payload.db.findVersions({
      branch: false,
      collection: versionedMediaSlug,
      pagination: false,
    })
    const ownedBranchVersions = branchVersionsBeforeMerge.docs.filter(
      (version) =>
        version._branch === branchSlug && String(version._branchParent) === String(original.id),
    )
    const archivedBranchFilenames = ownedBranchVersions
      .map((version) => getStoredVersionFilename({ version: version.version }))
      .filter(
        (versionFilename) =>
          versionFilename !== replacement.filename && versionFilename !== original.filename,
      )
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
    expect(ownedBranchVersions.length).toBeGreaterThan(0)
    expect(archivedBranchFilenames.length).toBeGreaterThan(0)
    for (const archivedBranchFilename of archivedBranchFilenames) {
      await expect(
        readFile(path.resolve(versionedMediaDirectory, archivedBranchFilename)),
      ).resolves.toBeDefined()
    }
    await expect(
      readFile(path.resolve(versionedMediaDirectory, onMainBeforeMerge.filename!)),
    ).resolves.toEqual(originalFileData)
    await expect(
      readFile(path.resolve(versionedMediaDirectory, onBranchBeforeMerge.filename!)),
    ).resolves.toEqual(replacementFileData)

    await payload.branches.merge({ branch: branchSlug, overrideAccess: true })

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
    const branchVersionsAfterMerge = await payload.db.findVersions({
      branch: false,
      collection: versionedMediaSlug,
      pagination: false,
      where: { _branch: { equals: branchSlug } },
    })
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
    expect(branchVersionsAfterMerge.docs).toHaveLength(0)
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
    for (const archivedBranchFilename of archivedBranchFilenames) {
      await expect(
        readFile(path.resolve(versionedMediaDirectory, archivedBranchFilename)),
      ).rejects.toMatchObject({ code: 'ENOENT' })
    }
  })

  test('should restore the main media file after merging a branch replacement', async ({
    payload,
    restClient,
  }) => {
    const branchSlug = 'restore-merged-media'
    const originalFileData = await readFile(path.resolve(dirname, '../uploads/image.png'))
    const replacementFileData = await readFile(path.resolve(dirname, '../uploads/image.jpg'))

    await payload.create({
      collection: branchesSlug,
      data: { name: 'Restore merged media', slug: branchSlug },
    })

    const original = await payload.create({
      collection: versionedMediaSlug,
      data: { alt: 'Original banner' },
      file: {
        name: 'restore-after-merge.png',
        data: originalFileData,
        mimetype: 'image/png',
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
    const originalMainVersion = mainVersionsBeforeMerge.docs.find(
      ({ version }) => version.alt === 'Original banner',
    )

    expect(originalMainVersion).toBeDefined()

    await payload.update({
      id: original.id,
      branch: branchSlug,
      collection: versionedMediaSlug,
      data: { alt: 'Branch replacement banner' },
      file: {
        name: 'restore-after-merge.jpg',
        data: replacementFileData,
        mimetype: 'image/jpeg',
        size: replacementFileData.length,
      },
      overrideAccess: true,
    })

    await payload.branches.merge({ branch: branchSlug, overrideAccess: true })

    const response = await restClient.POST(
      `/${versionedMediaSlug}/versions/${originalMainVersion!.id}`,
    )

    expect(response.status).toBe(200)

    const restoredOnMain = await payload.findByID({
      id: original.id,
      branch: false,
      collection: versionedMediaSlug,
      overrideAccess: true,
    })
    const mainVersionsAfterRestore = await payload.findVersions({
      collection: versionedMediaSlug,
      overrideAccess: true,
      pagination: false,
      where: { parent: { equals: original.id } },
    })
    const retainedReplacementVersion = mainVersionsAfterRestore.docs.find(
      ({ version }) => version.alt === 'Branch replacement banner',
    )

    expect(restoredOnMain.alt).toBe('Original banner')
    await expect(
      readFile(path.resolve(versionedMediaDirectory, restoredOnMain.filename!)),
    ).resolves.toEqual(originalFileData)
    expect(retainedReplacementVersion).toBeDefined()

    const retainedReplacementFilename = getStoredVersionFilename({
      version: retainedReplacementVersion!.version,
    })

    await expect(
      readFile(path.resolve(versionedMediaDirectory, retainedReplacementFilename)),
    ).resolves.toEqual(replacementFileData)
  })
})
