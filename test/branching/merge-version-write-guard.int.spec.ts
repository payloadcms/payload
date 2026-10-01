/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */

import type { Payload } from 'payload'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { hookSpy } from './hookSpy.js'
import {
  branchChangesSlug,
  branchesSlug,
  categoriesSlug,
  homepageGlobalSlug,
  localizedSlug,
} from './shared.js'

const createBranch = ({ name, payload }: { name: string; payload: Payload }) =>
  payload.create({
    collection: branchesSlug,
    data: { name },
    overrideAccess: true,
  })

const findCollectionChange = async ({
  branch,
  docID,
  payload,
}: {
  branch: string
  docID: number | string
  payload: Payload
}) => {
  const changes = await payload.find({
    collection: branchChangesSlug,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { branch: { equals: branch } },
        { collectionSlug: { equals: localizedSlug } },
        { 'doc.value': { equals: docID } },
      ],
    },
  })

  return changes.docs[0]!
}

const findGlobalChange = async ({ branch, payload }: { branch: string; payload: Payload }) => {
  const changes = await payload.find({
    collection: branchChangesSlug,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [{ branch: { equals: branch } }, { globalSlug: { equals: homepageGlobalSlug } }],
    },
  })

  return changes.docs[0]!
}

test.suite('Branch merge version write guard', { config: './config.ts' }, () => {
  test.afterEach(() => {
    hookSpy.mainMergeGlobalOriginalHeroTitles = undefined
    hookSpy.mainMergeLocalizedCollectionDependencyTargetID = undefined
    hookSpy.mainMergeLocalizedGlobalDependencyTargetID = undefined
  })

  test('should use the main global version as the original document during a merge', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Global original document', payload })

    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch: false,
      data: { _status: 'published', heroTitle: 'main current' },
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch: branch.slug,
      data: { _status: 'published', heroTitle: 'branch current' },
      overrideAccess: true,
    })

    const branchVersions = await payload.db.findGlobalVersions({
      branch: false,
      global: homepageGlobalSlug,
      pagination: false,
      where: { _branch: { equals: branch.slug } },
    })
    const branchVersion = branchVersions.docs.find(
      ({ version }) => version.heroTitle === 'branch current',
    )
    const globalChange = await findGlobalChange({ branch: branch.slug, payload })

    expect(branchVersion).toBeDefined()

    const legacyBranchVersion = await payload.db.updateGlobalVersion({
      id: branchVersion!.id,
      global: homepageGlobalSlug,
      versionData: {
        createdAt: branchVersion!.createdAt,
        latest: branchVersion!.latest,
        parent: branchVersion!.parent,
        publishedLocale: branchVersion!.publishedLocale,
        updatedAt: branchVersion!.updatedAt,
        version: { ...branchVersion!.version, _branch: 'main' },
      },
    })

    expect((legacyBranchVersion.version as Record<string, unknown>)._branch).toBe('main')

    hookSpy.mainMergeGlobalOriginalHeroTitles = []

    await payload.branches.merge({
      branch: branch.slug,
      changes: [globalChange.id],
      overrideAccess: true,
    })

    expect(hookSpy.mainMergeGlobalOriginalHeroTitles[0]).toBe('main current')
  })

  test('should block a draft merge when the latest main draft does not match access', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Global draft access', payload })

    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch: false,
      data: { _status: 'published', heroTitle: 'unlocked global' },
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch: false,
      data: { heroTitle: 'locked main draft' },
      draft: true,
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch: branch.slug,
      data: { heroTitle: 'requires unlocked global' },
      draft: true,
      overrideAccess: true,
    })

    const globalChange = await findGlobalChange({ branch: branch.slug, payload })
    const result = await payload.branches.merge({
      branch: branch.slug,
      changes: [globalChange.id],
      dryRun: true,
      overrideAccess: false,
    })

    expect(result.blocked).toContainEqual(
      expect.objectContaining({
        globalSlug: homepageGlobalSlug,
        operation: 'update',
        reason: 'access',
      }),
    )
  })

  test('should reject a draft-only branch global update when the effective draft does not match access', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Draft-only global access', payload })

    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch: branch.slug,
      data: { heroTitle: 'locked branch draft' },
      draft: true,
      overrideAccess: true,
    })

    await expect(
      payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch: branch.slug,
        data: { heroTitle: 'requires unlocked global' },
        draft: true,
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })

    const current = await payload.findGlobal({
      slug: homepageGlobalSlug,
      branch: branch.slug,
      draft: true,
      overrideAccess: true,
    })

    expect(current.heroTitle).toBe('locked branch draft')
  })

  test('should apply branch metadata access to the effective branch global version', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Branch version metadata access', payload })

    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch: branch.slug,
      data: { heroTitle: 'branch draft', localizedTitle: 'branch Spanish' },
      draft: true,
      locale: 'es',
      overrideAccess: true,
    })

    const updated = await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch: branch.slug,
      data: { heroTitle: 'draft allowed only off main' },
      draft: true,
      locale: 'es',
      overrideAccess: false,
    })

    expect(updated.heroTitle).toBe('draft allowed only off main')
  })

  test('should reject a dependency added to another collection locale before saving a version', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Collection version payload dependency', payload })
    const owner = await payload.create({
      collection: localizedSlug,
      data: { _status: 'published', title: 'main English' },
      locale: 'en',
      overrideAccess: true,
    })

    await payload.update({
      id: owner.id,
      collection: localizedSlug,
      data: { _status: 'published', title: 'main Spanish' },
      locale: 'es',
      overrideAccess: true,
    })

    await payload.update({
      id: owner.id,
      branch: branch.slug,
      collection: localizedSlug,
      data: { _status: 'published', title: 'branch English' },
      locale: 'en',
      overrideAccess: true,
    })

    const target = await payload.create({
      branch: branch.slug,
      collection: categoriesSlug,
      data: { name: 'unselected collection dependency' },
      overrideAccess: true,
    })
    const ownerChange = await findCollectionChange({
      branch: branch.slug,
      docID: owner.id,
      payload,
    })
    const originalBeginTransaction = payload.db.beginTransaction

    hookSpy.mainMergeLocalizedCollectionDependencyTargetID = target.id
    payload.db.beginTransaction = () => Promise.resolve(null)

    try {
      await expect(
        payload.branches.merge({
          branch: branch.slug,
          changes: [ownerChange.id],
          overrideAccess: true,
        }),
      ).rejects.toMatchObject({ status: 409 })
    } finally {
      payload.db.beginTransaction = originalBeginTransaction
    }

    const mainEnglish = await payload.findByID({
      id: owner.id,
      branch: false,
      collection: localizedSlug,
      depth: 0,
      locale: 'en',
      overrideAccess: true,
    })
    const mainSpanish = await payload.findByID({
      id: owner.id,
      branch: false,
      collection: localizedSlug,
      depth: 0,
      locale: 'es',
      overrideAccess: true,
    })

    expect(mainEnglish.title).toBe('main English')
    expect(mainSpanish.mergeGuardCategory == null).toBe(true)
  })

  test('should reject a dependency added to another global locale before saving a version', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Global version payload dependency', payload })

    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch: false,
      data: { _status: 'published', heroTitle: 'main global', localizedTitle: 'main English' },
      locale: 'en',
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch: false,
      data: { _status: 'published', localizedTitle: 'main Spanish' },
      locale: 'es',
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch: branch.slug,
      data: { _status: 'published', localizedTitle: 'branch English' },
      locale: 'en',
      overrideAccess: true,
    })

    const target = await payload.create({
      branch: branch.slug,
      collection: categoriesSlug,
      data: { name: 'unselected global dependency' },
      overrideAccess: true,
    })
    const globalChange = await findGlobalChange({ branch: branch.slug, payload })
    const originalBeginTransaction = payload.db.beginTransaction

    hookSpy.mainMergeLocalizedGlobalDependencyTargetID = target.id
    payload.db.beginTransaction = () => Promise.resolve(null)

    try {
      await expect(
        payload.branches.merge({
          branch: branch.slug,
          changes: [globalChange.id],
          overrideAccess: true,
        }),
      ).rejects.toMatchObject({ status: 409 })
    } finally {
      payload.db.beginTransaction = originalBeginTransaction
    }

    const mainEnglish = await payload.findGlobal({
      slug: homepageGlobalSlug,
      branch: false,
      depth: 0,
      locale: 'en',
      overrideAccess: true,
    })
    const mainSpanish = await payload.findGlobal({
      slug: homepageGlobalSlug,
      branch: false,
      depth: 0,
      locale: 'es',
      overrideAccess: true,
    })

    expect(mainEnglish.localizedTitle).toBe('main English')
    expect(mainSpanish.mergeGuardCategory == null).toBe(true)
  })
})
