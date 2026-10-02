/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */

import type { Payload } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'
import {
  branchesSlug,
  categoriesSlug,
  headerGlobalSlug,
  homepageGlobalSlug,
  pagesSlug,
  postsSlug,
  publicSlug,
} from './shared.js'

type GraphQLResult = {
  data?: Record<string, any>
  errors?: Array<{ message: string }>
}

const createBranch = async ({
  name,
  payload,
}: {
  name: string
  payload: Payload
}): Promise<string> => {
  const branch = await payload.create({
    collection: branchesSlug,
    data: { name },
    overrideAccess: true,
  })

  return branch.slug
}

const executeGraphQL = async ({
  isAuthenticated = true,
  query,
  restClient,
}: {
  isAuthenticated?: boolean
  query: string
  restClient: NextRESTClient
}): Promise<GraphQLResult> => {
  const response = await restClient.GRAPHQL_POST({
    auth: isAuthenticated,
    body: JSON.stringify({ query }),
  })

  expect(response.status).toBe(200)

  return response.json() as Promise<GraphQLResult>
}

const formatGraphQLID = ({ id, payload }: { id: number | string; payload: Payload }): string =>
  payload.db.defaultIDType === 'number' ? String(id) : JSON.stringify(String(id))

test.suite('Branching GraphQL', { config: './config.ts' }, () => {
  test.beforeEach(async ({ restClient }) => {
    await restClient.login({ slug: 'users' })
  })

  test('should reject an unauthorised field-level branch read', async ({ payload, restClient }) => {
    const branch = await createBranch({ name: 'Private Visibility', payload })
    const doc = await payload.create({
      collection: publicSlug,
      data: { _status: 'published', title: 'main title' },
      overrideAccess: true,
    })

    await payload.update({
      id: doc.id,
      branch,
      collection: publicSlug,
      data: { _status: 'published', title: 'private branch title' },
      overrideAccess: true,
    })

    const result = await executeGraphQL({
      isAuthenticated: false,
      query: `query {
        PublicDoc(id: ${formatGraphQLID({ id: doc.id, payload })}, branch: "${branch}") {
          title
        }
      }`,
      restClient,
    })

    expect(result.data?.PublicDoc).toBeNull()
    expect(result.errors).toHaveLength(1)
  })

  test('should reject an unauthorised collection document-access check', async ({
    payload,
    restClient,
  }) => {
    const branch = await createBranch({ name: 'Private Visibility', payload })
    const doc = await payload.create({
      collection: publicSlug,
      data: { _status: 'published', title: 'main title' },
      overrideAccess: true,
    })

    const result = await executeGraphQL({
      isAuthenticated: false,
      query: `query {
        docAccessPublicDoc(id: ${formatGraphQLID({ id: doc.id, payload })}, branch: "${branch}") {
          read { permission }
        }
      }`,
      restClient,
    })

    expect(result.data?.docAccessPublicDoc).toBeNull()
    expect(result.errors?.[0]?.message).toContain('not allowed')
  })

  test('should reject an unauthorised global document-access check', async ({
    payload,
    restClient,
  }) => {
    const branch = await createBranch({ name: 'Private Visibility', payload })
    const result = await executeGraphQL({
      isAuthenticated: false,
      query: `query {
        docAccessHeader(branch: "${branch}") {
          read { permission }
        }
      }`,
      restClient,
    })

    expect(result.data?.docAccessHeader).toBeNull()
    expect(result.errors?.[0]?.message).toContain('not allowed')
  })

  test('should create a collection document on the field-level branch', async ({
    payload,
    restClient,
  }) => {
    const branch = await createBranch({ name: 'GraphQL Create', payload })
    const result = await executeGraphQL({
      query: `mutation {
        createPost(branch: "${branch}", data: { title: "created on branch" }) {
          id
          title
        }
      }`,
      restClient,
    })

    expect(result.errors).toBeUndefined()

    const id = result.data?.createPost.id as number | string
    const onBranch = await payload.findByID({
      id,
      branch,
      collection: postsSlug,
      overrideAccess: true,
    })
    const onMain = await payload.findByID({
      id,
      collection: postsSlug,
      disableErrors: true,
      overrideAccess: true,
    })

    expect(onBranch.title).toBe('created on branch')
    expect(onMain).toBeNull()
  })

  test('should count collection documents on the field-level branch', async ({
    payload,
    restClient,
  }) => {
    const branch = await createBranch({ name: 'GraphQL Count', payload })

    await payload.create({
      branch,
      collection: postsSlug,
      data: { title: 'branch count target' },
      overrideAccess: true,
    })

    const result = await executeGraphQL({
      query: `query {
        countPosts(branch: "${branch}", where: { title: { equals: "branch count target" } }) {
          totalDocs
        }
      }`,
      restClient,
    })

    expect(result.errors).toBeUndefined()
    expect(result.data?.countPosts.totalDocs).toBe(1)
  })

  test('should update a collection document on the field-level branch', async ({
    payload,
    restClient,
  }) => {
    const branch = await createBranch({ name: 'GraphQL Update', payload })
    const post = await payload.create({
      collection: postsSlug,
      data: { title: 'main title' },
      overrideAccess: true,
    })

    const result = await executeGraphQL({
      query: `mutation {
        updatePost(
          id: ${formatGraphQLID({ id: post.id, payload })}
          branch: "${branch}"
          data: { title: "branch title" }
        ) {
          title
        }
      }`,
      restClient,
    })

    expect(result.errors).toBeUndefined()
    expect(result.data?.updatePost.title).toBe('branch title')

    const onBranch = await payload.findByID({
      id: post.id,
      branch,
      collection: postsSlug,
      overrideAccess: true,
    })
    const onMain = await payload.findByID({
      id: post.id,
      collection: postsSlug,
      overrideAccess: true,
    })

    expect(onBranch.title).toBe('branch title')
    expect(onMain.title).toBe('main title')
  })

  test('should restore a collection version on the field-level branch', async ({
    payload,
    restClient,
  }) => {
    const branch = await createBranch({ name: 'GraphQL Collection Restore', payload })
    const page = await payload.create({
      collection: pagesSlug,
      data: { title: 'main page' },
      draft: true,
      overrideAccess: true,
    })

    await payload.update({
      id: page.id,
      branch,
      collection: pagesSlug,
      data: { title: 'branch page one' },
      draft: true,
      overrideAccess: true,
    })
    await payload.update({
      id: page.id,
      branch,
      collection: pagesSlug,
      data: { title: 'branch page two' },
      draft: true,
      overrideAccess: true,
    })

    const versions = await payload.findVersions({
      branch,
      collection: pagesSlug,
      overrideAccess: true,
      pagination: false,
    })
    const version = versions.docs.find(({ version }) => version.title === 'branch page one')

    expect(version).toBeDefined()

    const result = await executeGraphQL({
      query: `mutation {
        restoreVersionPage(
          id: ${formatGraphQLID({ id: version!.id, payload })}
          branch: "${branch}"
          draft: true
        ) {
          title
        }
      }`,
      restClient,
    })

    expect(result.errors).toBeUndefined()

    const onBranch = await payload.findByID({
      id: page.id,
      branch,
      collection: pagesSlug,
      draft: true,
      overrideAccess: true,
    })
    const onMain = await payload.findByID({
      id: page.id,
      collection: pagesSlug,
      draft: true,
      overrideAccess: true,
    })

    expect(onBranch.title).toBe('branch page one')
    expect(onMain.title).toBe('main page')
  })

  test('should update a global on the field-level branch', async ({ payload, restClient }) => {
    const branch = await createBranch({ name: 'GraphQL Global Update', payload })

    await payload.updateGlobal({
      slug: headerGlobalSlug,
      data: { navLabel: 'main label' },
      overrideAccess: true,
    })

    const result = await executeGraphQL({
      query: `mutation {
        updateHeader(branch: "${branch}", data: { navLabel: "branch label" }) {
          navLabel
        }
      }`,
      restClient,
    })

    expect(result.errors).toBeUndefined()

    const onBranch = await payload.findGlobal({
      slug: headerGlobalSlug,
      branch,
      overrideAccess: true,
    })
    const onMain = await payload.findGlobal({
      slug: headerGlobalSlug,
      overrideAccess: true,
    })

    expect(onBranch.navLabel).toBe('branch label')
    expect(onMain.navLabel).toBe('main label')
  })

  test('should restore a global version on the field-level branch', async ({
    payload,
    restClient,
  }) => {
    const branch = await createBranch({ name: 'GraphQL Global Restore', payload })

    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      data: { heroTitle: 'main hero' },
      draft: true,
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch,
      data: { heroTitle: 'branch hero one' },
      draft: true,
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch,
      data: { heroTitle: 'branch hero two' },
      draft: true,
      overrideAccess: true,
    })

    const versions = await payload.findGlobalVersions({
      slug: homepageGlobalSlug,
      branch,
      overrideAccess: true,
      pagination: false,
    })
    const version = versions.docs.find(({ version }) => version.heroTitle === 'branch hero one')

    expect(version).toBeDefined()

    const result = await executeGraphQL({
      query: `mutation {
        restoreVersionHomepage(
          id: ${formatGraphQLID({ id: version!.id, payload })}
          branch: "${branch}"
          draft: true
        ) {
          heroTitle
        }
      }`,
      restClient,
    })

    expect(result.errors).toBeUndefined()
    expect(result.data?.restoreVersionHomepage).toMatchObject({ heroTitle: 'branch hero one' })

    const versionsAfterRestore = await payload.findGlobalVersions({
      slug: homepageGlobalSlug,
      branch,
      overrideAccess: true,
      pagination: false,
    })
    const latestVersionAfterRestore = versionsAfterRestore.docs.find(({ latest }) => latest)
    const mainVersionsAfterRestore = await payload.findGlobalVersions({
      slug: homepageGlobalSlug,
      overrideAccess: true,
      pagination: false,
    })

    expect(latestVersionAfterRestore?.version.heroTitle).toBe('branch hero one')
    expect(mainVersionsAfterRestore.docs.map(({ version }) => version.heroTitle)).not.toContain(
      'branch hero one',
    )

    const onBranch = await payload.findGlobal({
      slug: homepageGlobalSlug,
      branch,
      draft: true,
      overrideAccess: true,
    })
    const onMain = await payload.findGlobal({
      slug: homepageGlobalSlug,
      draft: true,
      overrideAccess: true,
    })

    expect(onBranch.heroTitle).toBe('branch hero one')
    expect(onMain.heroTitle).toBe('main hero')
  })

  test('should populate relationships from the field-level branch', async ({
    payload,
    restClient,
  }) => {
    const branch = await createBranch({ name: 'GraphQL Relationship', payload })
    const category = await payload.create({
      collection: categoriesSlug,
      data: { name: 'main category' },
      overrideAccess: true,
    })
    const post = await payload.create({
      collection: postsSlug,
      data: { category: category.id, title: 'related post' },
      overrideAccess: true,
    })

    await payload.update({
      id: category.id,
      branch,
      collection: categoriesSlug,
      data: { name: 'branch category' },
      overrideAccess: true,
    })

    const result = await executeGraphQL({
      query: `query {
        Post(id: ${formatGraphQLID({ id: post.id, payload })}, branch: "${branch}") {
          category {
            name
          }
        }
      }`,
      restClient,
    })

    expect(result.errors).toBeUndefined()
    expect(result.data?.Post.category.name).toBe('branch category')
  })

  test('should populate joins from the field-level branch', async ({ payload, restClient }) => {
    const branch = await createBranch({ name: 'GraphQL Join', payload })
    const category = await payload.create({
      collection: categoriesSlug,
      data: { name: 'join category' },
      overrideAccess: true,
    })
    const post = await payload.create({
      collection: postsSlug,
      data: { category: category.id, title: 'main joined post' },
      overrideAccess: true,
    })

    await payload.update({
      id: post.id,
      branch,
      collection: postsSlug,
      data: { title: 'branch joined post' },
      overrideAccess: true,
    })

    const result = await executeGraphQL({
      query: `query {
        Category(id: ${formatGraphQLID({ id: category.id, payload })}, branch: "${branch}") {
          posts {
            docs { title }
          }
        }
      }`,
      restClient,
    })

    expect(result.errors).toBeUndefined()
    expect(result.data?.Category.posts.docs).toEqual([
      expect.objectContaining({ title: 'branch joined post' }),
    ])
  })

  test('should isolate two root fields that read different branches', async ({
    payload,
    restClient,
  }) => {
    const firstBranch = await createBranch({ name: 'GraphQL First Root', payload })
    const secondBranch = await createBranch({ name: 'GraphQL Second Root', payload })
    const category = await payload.create({
      collection: categoriesSlug,
      data: { name: 'main category' },
      overrideAccess: true,
    })
    const post = await payload.create({
      collection: postsSlug,
      data: { category: category.id, title: 'main post' },
      overrideAccess: true,
    })

    for (const [branch, categoryName, postTitle] of [
      [firstBranch, 'first category', 'first post'],
      [secondBranch, 'second category', 'second post'],
    ] as const) {
      await payload.update({
        id: category.id,
        branch,
        collection: categoriesSlug,
        data: { name: categoryName },
        overrideAccess: true,
      })
      await payload.update({
        id: post.id,
        branch,
        collection: postsSlug,
        data: { title: postTitle },
        overrideAccess: true,
      })
    }

    const result = await executeGraphQL({
      query: `query {
        first: Post(id: ${formatGraphQLID({ id: post.id, payload })}, branch: "${firstBranch}") {
          title
          category { name }
        }
        second: Post(id: ${formatGraphQLID({ id: post.id, payload })}, branch: "${secondBranch}") {
          title
          category { name }
        }
      }`,
      restClient,
    })

    expect(result.errors).toBeUndefined()
    expect(result.data?.first).toMatchObject({
      category: { name: 'first category' },
      title: 'first post',
    })
    expect(result.data?.second).toMatchObject({
      category: { name: 'second category' },
      title: 'second post',
    })
  })
})
