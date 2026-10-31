/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */

import type { Payload } from 'payload'

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { branchesSlug, homepageGlobalSlug, pagesSlug } from './shared.js'

const createVersionHistory = async ({ payload }: { payload: Payload }) => {
  const branch = await payload.create({
    collection: branchesSlug,
    data: { name: 'Version metadata' },
    overrideAccess: true,
  })
  const doc = await payload.create({
    collection: pagesSlug,
    data: { title: 'main title' },
    overrideAccess: true,
  })

  await payload.update({
    id: doc.id,
    branch: branch.slug,
    collection: pagesSlug,
    data: { title: 'branch title' },
    overrideAccess: true,
  })

  const stored = await payload.db.findVersions({
    branch: false,
    collection: pagesSlug,
    pagination: false,
    where: { _branch: { equals: branch.slug } },
  })
  const version = stored.docs.find(({ version }) => version.title === 'branch title')!

  expect(version).toBeDefined()
  expect(String(version.parent)).not.toBe(String(doc.id))
  expect(String(version._branchParent)).toBe(String(doc.id))

  return { branch: branch.slug, doc, version }
}

test.suite('Branch version response metadata', { config: './config.ts' }, () => {
  test('should return logical parents without internal metadata for selected and populated version reads', async ({
    payload,
  }) => {
    const { branch, doc, version } = await createVersionHistory({ payload })

    for (const select of [undefined, { title: true }, { title: false }]) {
      const versions = await payload.findVersions({
        branch,
        collection: pagesSlug,
        depth: 2,
        overrideAccess: true,
        populate: { [pagesSlug]: { title: true } },
        select,
        where: { parent: { equals: doc.id } },
      })
      const listed = versions.docs.find(({ id }) => String(id) === String(version.id))!
      const single = await payload.findVersionByID({
        id: String(version.id),
        branch,
        collection: pagesSlug,
        depth: 2,
        overrideAccess: true,
        select,
        showHiddenFields: true,
      })

      for (const result of [listed, single]) {
        expect(result).toMatchObject({ parent: doc.id })
        expect(result).not.toHaveProperty('_branchParent')
      }
    }
  })

  test('should retain raw identities for bypass reads and restore the branch version', async ({
    payload,
  }) => {
    const { branch, doc, version } = await createVersionHistory({ payload })
    const raw = await payload.findVersionByID({
      id: String(version.id),
      branch: false,
      collection: pagesSlug,
      overrideAccess: true,
    })

    expect(raw).toMatchObject({ parent: version.parent, _branchParent: doc.id })

    const rawList = await payload.findVersions({
      branch: false,
      collection: pagesSlug,
      overrideAccess: true,
      where: { id: { equals: version.id } },
    })

    expect(rawList.docs[0]).toMatchObject({ parent: version.parent, _branchParent: doc.id })

    await payload.update({
      id: doc.id,
      branch,
      collection: pagesSlug,
      data: { title: 'later branch title' },
      overrideAccess: true,
    })

    const restored = await payload.restoreVersion({
      id: String(version.id),
      branch,
      collection: pagesSlug,
      overrideAccess: true,
    })

    expect(restored.title).toBe('branch title')

    const stored = await payload.db.findVersions({
      branch: false,
      collection: pagesSlug,
      where: { id: { equals: version.id } },
    })

    expect(stored.docs[0]).toMatchObject({ parent: version.parent, _branchParent: doc.id })
  })

  test('should preserve main and branch-created version identities', async ({ payload }) => {
    const { branch, doc } = await createVersionHistory({ payload })
    const created = await payload.create({
      branch,
      collection: pagesSlug,
      data: { title: 'created on branch' },
      overrideAccess: true,
    })

    for (const [owner, parent] of [
      ['main', doc.id],
      [branch, created.id],
    ] as const) {
      const versions = await payload.findVersions({
        branch: owner,
        collection: pagesSlug,
        overrideAccess: true,
        where: { parent: { equals: parent } },
      })

      expect(versions.docs.length).toBeGreaterThan(0)

      for (const version of versions.docs) {
        const single = await payload.findVersionByID({
          id: String(version.id),
          branch: owner,
          collection: pagesSlug,
          overrideAccess: true,
        })

        for (const result of [version, single]) {
          expect(result).toMatchObject({ _branch: owner, parent })
          expect(result).not.toHaveProperty('_branchParent')
        }
      }
    }
  })

  test('should expose branch provenance through REST and GraphQL version reads', async ({
    payload,
    restClient,
  }) => {
    const { branch, doc, version } = await createVersionHistory({ payload })

    await restClient.login({ slug: 'users' })

    for (const path of [
      `/${pagesSlug}/versions`,
      `/${pagesSlug}/versions/${version.id}`,
    ] as const) {
      const response = await restClient.GET(path, { query: { branch, depth: 2 } })

      expect(response.status).toBe(200)

      const body = await response.json()
      const result = body.docs
        ? body.docs.find(({ id }: { id: number | string }) => String(id) === String(version.id))
        : body

      expect(result).toMatchObject({ _branch: branch, parent: doc.id })
      expect(result).not.toHaveProperty('_branchParent')
    }

    const response = await restClient.GRAPHQL_POST({
      body: JSON.stringify({
        query: `query {
          versionsPages(branch: "${branch}") { docs { id _branch parent { id title } } }
          versionPage(branch: "${branch}", id: ${JSON.stringify(version.id)}) { id _branch parent { id title } }
          __type(name: "PageVersion") { fields { name } }
        }`,
      }),
    })
    const result = await response.json()

    expect(result.errors).toBeUndefined()
    expect(result.data.__type.fields.map(({ name }: { name: string }) => name)).toContain('_branch')
    expect(result.data.__type.fields.map(({ name }: { name: string }) => name)).not.toContain(
      '_branchParent',
    )

    for (const item of [
      result.data.versionsPages.docs.find(
        ({ id }: { id: number | string }) => String(id) === String(version.id),
      ),
      result.data.versionPage,
    ]) {
      expect(item._branch).toBe(branch)
      expect(String(item.parent.id)).toBe(String(doc.id))
      expect(item.parent.title).toBe('branch title')
    }
  })

  test('should retain branch provenance on global version lists and single reads across APIs', async ({
    payload,
    restClient,
  }) => {
    const { branch } = await createVersionHistory({ payload })

    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch,
      data: { heroTitle: 'branch hero' },
      overrideAccess: true,
    })

    const versions = await payload.findGlobalVersions({
      slug: homepageGlobalSlug,
      branch,
      overrideAccess: true,
    })
    const version = versions.docs.find(({ version }) => version.heroTitle === 'branch hero')!
    const single = await payload.findGlobalVersionByID({
      slug: homepageGlobalSlug,
      branch,
      id: String(version.id),
      overrideAccess: true,
    })

    expect(version._branch).toBe(branch)
    expect(single._branch).toBe(branch)

    await restClient.login({ slug: 'users' })

    for (const path of [
      `/globals/${homepageGlobalSlug}/versions`,
      `/globals/${homepageGlobalSlug}/versions/${version.id}`,
    ] as const) {
      const response = await restClient.GET(path, { query: { branch } })

      expect(response.status).toBe(200)

      const body = await response.json()
      const result = body.docs
        ? body.docs.find(({ id }: { id: number | string }) => String(id) === String(version.id))
        : body

      expect(result._branch).toBe(branch)
    }

    const response = await restClient.GRAPHQL_POST({
      body: JSON.stringify({
        query: `query {
          versionsHomepage(branch: "${branch}") { docs { id _branch } }
          versionHomepage(branch: "${branch}", id: ${JSON.stringify(version.id)}) { id _branch }
        }`,
      }),
    })
    const result = await response.json()

    expect(result.errors).toBeUndefined()
    expect(result.data.versionHomepage._branch).toBe(branch)
    expect(
      result.data.versionsHomepage.docs.find(
        ({ id }: { id: number | string }) => String(id) === String(version.id),
      )._branch,
    ).toBe(branch)
  })
})
