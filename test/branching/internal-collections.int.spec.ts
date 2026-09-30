/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */

import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  branchChangesSlug,
  branchesSlug,
  branchMergesSlug,
  categoriesSlug,
  postsSlug,
} from './shared.js'

test.suite('Branching internal collections', { config: './config.ts' }, () => {
  test('should restrict branch updates to branches the user can read', async ({ payload }) => {
    const user = await payload.create({
      collection: 'users',
      data: { email: 'branch-reader@example.com', password: 'test' },
      overrideAccess: true,
    })
    const privateBranch = await payload.create({
      collection: branchesSlug,
      data: { name: 'Private Visibility' },
      overrideAccess: true,
    })

    await expect(
      payload.update({
        id: privateBranch.id,
        collection: branchesSlug,
        data: { description: 'unauthorised change' },
        overrideAccess: false,
        user: { ...user, collection: 'users' } as never,
      }),
    ).rejects.toThrow()
  })

  test('should keep branch status fields under server control', async ({ payload }) => {
    const user = await payload.create({
      collection: 'users',
      data: { email: 'branch-editor@example.com', password: 'test' },
      overrideAccess: true,
    })
    const branch = await payload.create({
      collection: branchesSlug,
      data: { name: 'Editable Branch' },
      overrideAccess: true,
    })

    const updated = await payload.update({
      id: branch.id,
      collection: branchesSlug,
      data: {
        mergedAt: new Date().toISOString(),
        mergeProgress: '999/999',
        status: 'closed',
      },
      overrideAccess: false,
      user: { ...user, collection: 'users' } as never,
    })

    expect(updated.mergeProgress).toBeFalsy()
    expect(updated.mergedAt).toBeFalsy()
    expect(updated.status).toBe('open')
  })

  test('should prevent callers from reading the branch change registry', async ({ payload }) => {
    const user = await payload.create({
      collection: 'users',
      data: { email: 'change-reader@example.com', password: 'test' },
      overrideAccess: true,
    })

    await payload.create({
      collection: branchesSlug,
      data: { name: 'Visible Branch' },
      overrideAccess: true,
    })
    await payload.create({
      collection: branchesSlug,
      data: { name: 'Private Visibility' },
      overrideAccess: true,
    })
    await payload.create({
      collection: branchChangesSlug,
      data: {
        branch: 'visible-branch',
        entityType: 'global',
        globalSlug: 'header',
        operation: 'update',
      },
      overrideAccess: true,
    })
    await payload.create({
      collection: branchChangesSlug,
      data: {
        branch: 'private-visibility',
        entityType: 'global',
        globalSlug: 'header',
        operation: 'update',
      },
      overrideAccess: true,
    })

    await expect(
      payload.find({
        collection: branchChangesSlug,
        overrideAccess: false,
        pagination: false,
        user: { ...user, collection: 'users' } as never,
      }),
    ).rejects.toThrow()
  })

  test('should prevent callers from writing the branch change registry', async ({ payload }) => {
    const user = await payload.create({
      collection: 'users',
      data: { email: 'change-writer@example.com', password: 'test' },
      overrideAccess: true,
    })
    const branch = await payload.create({
      collection: branchesSlug,
      data: { name: 'Protected Registry' },
      overrideAccess: true,
    })
    const existing = await payload.create({
      collection: branchChangesSlug,
      data: {
        branch: branch.slug,
        entityType: 'global',
        globalSlug: 'header',
        operation: 'update',
      },
      overrideAccess: true,
    })
    const actingUser = { ...user, collection: 'users' } as never

    await expect(
      payload.create({
        collection: branchChangesSlug,
        data: {
          branch: branch.slug,
          entityType: 'global',
          globalSlug: 'homepage',
          operation: 'update',
        },
        overrideAccess: false,
        user: actingUser,
      }),
    ).rejects.toThrow()

    await expect(
      payload.update({
        id: existing.id,
        collection: branchChangesSlug,
        data: { operation: 'delete' },
        overrideAccess: false,
        user: actingUser,
      }),
    ).rejects.toThrow()

    await expect(
      payload.delete({
        id: existing.id,
        collection: branchChangesSlug,
        overrideAccess: false,
        user: actingUser,
      }),
    ).rejects.toThrow()
  })

  test('should remove branch state before deleting a branch record', async ({ payload }) => {
    const branch = await payload.create({
      collection: branchesSlug,
      data: { name: 'Disposable Branch' },
      overrideAccess: true,
    })
    const post = await payload.create({
      collection: postsSlug,
      data: { title: 'main title' },
      overrideAccess: true,
    })

    await payload.update({
      id: post.id,
      branch: branch.slug,
      collection: postsSlug,
      data: { title: 'discarded branch title' },
      overrideAccess: true,
    })
    await payload.create({
      collection: branchMergesSlug,
      data: { branch: branch.slug, changes: [], mergedAt: new Date().toISOString() },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'payload-jobs',
      data: {
        input: { branch: branch.slug },
        taskSlug: 'scheduleMerge',
        waitUntil: new Date(Date.now() + 60_000).toISOString(),
      },
      overrideAccess: true,
    })

    await payload.delete({
      id: branch.id,
      collection: branchesSlug,
      overrideAccess: true,
    })
    await payload.create({
      collection: branchesSlug,
      data: { name: 'Disposable Branch' },
      overrideAccess: true,
    })

    const postOnRecreatedBranch = await payload.findByID({
      id: post.id,
      branch: branch.slug,
      collection: postsSlug,
      overrideAccess: true,
    })
    const remainingChanges = await payload.find({
      collection: branchChangesSlug,
      overrideAccess: true,
      pagination: false,
      where: { branch: { equals: branch.slug } },
    })
    const remainingMerges = await payload.find({
      collection: branchMergesSlug,
      overrideAccess: true,
      pagination: false,
      where: { branch: { equals: branch.slug } },
    })
    const remainingJobs = await payload.find({
      collection: 'payload-jobs',
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          { taskSlug: { equals: 'scheduleMerge' } },
          { 'input.branch': { equals: branch.slug } },
        ],
      },
    })

    expect(postOnRecreatedBranch.title).toBe('main title')
    expect(remainingChanges.docs).toHaveLength(0)
    expect(remainingMerges.docs).toHaveLength(0)
    expect(remainingJobs.docs).toHaveLength(0)
  })

  test('should not delete a branch while its scheduled merge is running', async ({ payload }) => {
    const branch = await payload.create({
      collection: branchesSlug,
      data: { name: 'Running Merge Branch' },
      overrideAccess: true,
    })

    await payload.create({
      collection: 'payload-jobs',
      data: {
        input: { branch: branch.slug },
        processingUntil: new Date(Date.now() + 60_000).toISOString(),
        taskSlug: 'scheduleMerge',
        waitUntil: new Date(Date.now() - 60_000).toISOString(),
      },
      overrideAccess: true,
    })

    await expect(
      payload.delete({
        id: branch.id,
        collection: branchesSlug,
        overrideAccess: true,
      }),
    ).rejects.toThrow()

    const preservedBranch = await payload.findByID({
      id: branch.id,
      collection: branchesSlug,
      overrideAccess: true,
    })

    expect(preservedBranch.slug).toBe(branch.slug)
  })

  test('should preserve main relationships when discarding branch-created targets', async ({
    payload,
  }) => {
    const branch = await payload.create({
      collection: branchesSlug,
      data: { name: 'Relationship Discard' },
      overrideAccess: true,
    })
    const mainCategory = await payload.create({
      collection: categoriesSlug,
      data: { name: 'main category' },
      overrideAccess: true,
    })
    const mainPost = await payload.create({
      collection: postsSlug,
      data: { category: mainCategory.id, title: 'main post' },
      overrideAccess: true,
    })
    const branchCategory = await payload.create({
      branch: branch.slug,
      collection: categoriesSlug,
      data: { name: 'branch category' },
      overrideAccess: true,
    })

    await payload.update({
      id: mainPost.id,
      branch: branch.slug,
      collection: postsSlug,
      data: { category: branchCategory.id },
      overrideAccess: true,
    })
    await payload.branches.discard({
      branch: branch.slug,
      overrideAccess: true,
    })

    const preservedMainPost = await payload.findByID({
      id: mainPost.id,
      collection: postsSlug,
      depth: 1,
      overrideAccess: true,
    })

    expect((preservedMainPost.category as { id: number | string }).id).toBe(mainCategory.id)
  })

  test('should refuse branch deletion when main references a branch-created document', async ({
    payload,
  }) => {
    const branch = await payload.create({
      collection: branchesSlug,
      data: { name: 'Referenced Branch Target' },
      overrideAccess: true,
    })
    const branchCategory = await payload.create({
      branch: branch.slug,
      collection: categoriesSlug,
      data: { name: 'branch category' },
      overrideAccess: true,
    })
    const mainPost = await payload.create({
      collection: postsSlug,
      data: { category: branchCategory.id, title: 'main post' },
      overrideAccess: true,
    })

    await expect(
      payload.delete({
        id: branch.id,
        collection: branchesSlug,
        overrideAccess: true,
      }),
    ).rejects.toThrow()

    const preservedMainPost = await payload.findByID({
      id: mainPost.id,
      collection: postsSlug,
      depth: 0,
      overrideAccess: true,
    })
    const preservedBranch = await payload.findByID({
      id: branch.id,
      collection: branchesSlug,
      overrideAccess: true,
    })

    expect(preservedMainPost.category).toBe(branchCategory.id)
    expect(preservedBranch.slug).toBe(branch.slug)
  })
})
