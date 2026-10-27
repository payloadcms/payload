import { readFile, rm } from 'node:fs/promises'

import path from 'node:path'

import { fileURLToPath } from 'node:url'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

import { branchesSlug, versionedMediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)

const dirname = path.dirname(filename)

const versionedMediaDirectory = path.resolve(dirname, 'versioned-media')

test.suite('Branching versioned media files', { config: './config.ts' }, () => {
  test.afterEach(async () => {
    await rm(versionedMediaDirectory, { force: true, recursive: true })
  })

  test('should restore a media version on its branch without changing main', async ({
    payload,
    restClient,
  }) => {
    const branchSlug = 'restore-media-on-branch'
    const originalFileData = await readFile(path.resolve(dirname, '../uploads/image.png'))
    const replacementFileData = await readFile(path.resolve(dirname, '../uploads/image.jpg'))

    await payload.create({
      collection: branchesSlug,
      data: { name: 'Restore media on branch', slug: branchSlug },
    })

    const original = await payload.create({
      collection: versionedMediaSlug,
      data: { alt: 'Original banner' },
      file: {
        name: 'restore-on-branch.png',
        data: originalFileData,
        mimetype: 'image/png',
        size: originalFileData.length,
      },
      overrideAccess: true,
    })

    await payload.update({
      id: original.id,
      branch: branchSlug,
      collection: versionedMediaSlug,
      data: { alt: 'Branch metadata edit' },
      overrideAccess: true,
    })

    await payload.update({
      id: original.id,
      branch: branchSlug,
      collection: versionedMediaSlug,
      data: { alt: 'Branch replacement banner' },
      file: {
        name: 'restore-on-branch.jpg',
        data: replacementFileData,
        mimetype: 'image/jpeg',
        size: replacementFileData.length,
      },
      overrideAccess: true,
    })

    const allVersions = await payload.db.findVersions({
      branch: false,
      collection: versionedMediaSlug,
      pagination: false,
    })
    const branchVersionToRestore = allVersions.docs.find(
      (version) =>
        version._branch === branchSlug &&
        String(version._branchParent) === String(original.id) &&
        version.version.alt === 'Branch metadata edit',
    )

    expect(branchVersionToRestore).toBeDefined()

    const response = await restClient.POST(
      `/${versionedMediaSlug}/versions/${branchVersionToRestore!.id}?branch=${branchSlug}`,
    )

    expect(response.status).toBe(200)

    const [restoredOnBranch, unchangedOnMain] = await Promise.all([
      payload.findByID({
        id: original.id,
        branch: branchSlug,
        collection: versionedMediaSlug,
        overrideAccess: true,
      }),
      payload.findByID({
        id: original.id,
        branch: false,
        collection: versionedMediaSlug,
        overrideAccess: true,
      }),
    ])

    expect(restoredOnBranch.alt).toBe('Branch metadata edit')
    expect(restoredOnBranch.filename).toContain(branchSlug)
    expect(restoredOnBranch.filename).not.toBe(unchangedOnMain.filename)
    await expect(
      readFile(path.resolve(versionedMediaDirectory, restoredOnBranch.filename!)),
    ).resolves.toEqual(originalFileData)
    expect(unchangedOnMain.alt).toBe('Original banner')
    expect(unchangedOnMain.filename).toBe(original.filename)
    await expect(
      readFile(path.resolve(versionedMediaDirectory, unchangedOnMain.filename!)),
    ).resolves.toEqual(originalFileData)
  })

  test('should retain branch ownership when restoring a raw branch version', async ({
    payload,
  }) => {
    const branchSlug = 'restore-raw-branch-version'
    const originalFileData = await readFile(path.resolve(dirname, '../uploads/image.png'))

    await payload.create({
      collection: branchesSlug,
      data: { name: 'Restore raw branch version', slug: branchSlug },
    })

    const original = await payload.create({
      collection: versionedMediaSlug,
      data: { alt: 'Original banner' },
      file: {
        name: 'restore-raw-branch-version.png',
        data: originalFileData,
        mimetype: 'image/png',
        size: originalFileData.length,
      },
      overrideAccess: true,
    })

    await payload.update({
      id: original.id,
      branch: branchSlug,
      collection: versionedMediaSlug,
      data: { alt: 'First branch version' },
      overrideAccess: true,
    })

    await payload.update({
      id: original.id,
      branch: branchSlug,
      collection: versionedMediaSlug,
      data: { alt: 'Current branch version' },
      overrideAccess: true,
    })

    const rawVersions = await payload.db.findVersions({
      branch: false,
      collection: versionedMediaSlug,
      pagination: false,
    })
    const branchVersionToRestore = rawVersions.docs.find(
      (version) =>
        version._branch === branchSlug &&
        String(version._branchParent) === String(original.id) &&
        version.version.alt === 'First branch version',
    )

    expect(branchVersionToRestore).toBeDefined()

    await payload.restoreVersion({
      id: branchVersionToRestore!.id,
      branch: false,
      collection: versionedMediaSlug,
      overrideAccess: true,
    })

    const rawDocuments = await payload.find({
      branch: false,
      collection: versionedMediaSlug,
      overrideAccess: true,
      pagination: false,
      showHiddenFields: true,
    })
    const mainDocuments = rawDocuments.docs.filter((document) => document._branch === 'main')
    const branchDocument = rawDocuments.docs.find((document) => document._branch === branchSlug)

    expect(mainDocuments).toHaveLength(1)
    expect(mainDocuments[0]!.id).toBe(original.id)
    expect(mainDocuments[0]!.alt).toBe('Original banner')
    expect(branchDocument).toMatchObject({
      _branch: branchSlug,
      _branchDocID: original.id,
      alt: 'First branch version',
    })
  })

  test('should retain a branch-created document identity when restoring its version', async ({
    payload,
  }) => {
    const branchSlug = 'restore-branch-created-version'
    const originalFileData = await readFile(path.resolve(dirname, '../uploads/image.png'))

    await payload.create({
      collection: branchesSlug,
      data: { name: 'Restore branch-created version', slug: branchSlug },
    })

    const branchCreated = await payload.create({
      branch: branchSlug,
      collection: versionedMediaSlug,
      data: { alt: 'Created on branch' },
      file: {
        name: 'branch-created-version.png',
        data: originalFileData,
        mimetype: 'image/png',
        size: originalFileData.length,
      },
      overrideAccess: true,
    })

    await payload.update({
      id: branchCreated.id,
      branch: branchSlug,
      collection: versionedMediaSlug,
      data: { alt: 'Updated on branch' },
      overrideAccess: true,
    })

    const rawVersions = await payload.db.findVersions({
      branch: false,
      collection: versionedMediaSlug,
      pagination: false,
    })
    const branchVersionToRestore = rawVersions.docs.find(
      (version) => version._branch === branchSlug && version.version.alt === 'Created on branch',
    )

    expect(branchVersionToRestore).toBeDefined()

    await payload.restoreVersion({
      id: branchVersionToRestore!.id,
      branch: false,
      collection: versionedMediaSlug,
      overrideAccess: true,
    })

    const [rawDocuments, documentsOnMain] = await Promise.all([
      payload.find({
        branch: false,
        collection: versionedMediaSlug,
        overrideAccess: true,
        pagination: false,
        showHiddenFields: true,
      }),
      payload.find({
        collection: versionedMediaSlug,
        overrideAccess: true,
        pagination: false,
        where: { id: { equals: branchCreated.id } },
      }),
    ])

    expect(rawDocuments.docs).toHaveLength(1)
    expect(rawDocuments.docs[0]).toMatchObject({
      id: branchCreated.id,
      _branch: branchSlug,
      _branchDocID: null,
      alt: 'Created on branch',
    })
    expect(documentsOnMain.docs).toHaveLength(0)
  })
})
