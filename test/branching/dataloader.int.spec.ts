/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */

import { createPayloadRequest, isolateObjectProperty } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { branchesSlug, postsSlug } from './shared.js'

test.suite('Branching find dataloader', { config: './config.ts' }, () => {
  test('should keep find results separate for each branch in one request', async ({ payload }) => {
    for (const name of ['First Cache Branch', 'Second Cache Branch']) {
      await payload.create({
        collection: branchesSlug,
        data: { name },
        overrideAccess: true,
      })
    }

    const post = await payload.create({
      collection: postsSlug,
      data: { title: 'main title' },
      overrideAccess: true,
    })

    await payload.update({
      id: post.id,
      branch: 'first-cache-branch',
      collection: postsSlug,
      data: { title: 'first branch title' },
      overrideAccess: true,
    })
    await payload.update({
      id: post.id,
      branch: 'second-cache-branch',
      collection: postsSlug,
      data: { title: 'second branch title' },
      overrideAccess: true,
    })

    const baseRequest = await createPayloadRequest({ payload })
    const findOnBranch = async (branch: string) => {
      const branchRequest = isolateObjectProperty(baseRequest, ['branch', 'context'])

      branchRequest.branch = branch
      branchRequest.context = {}

      return branchRequest.payloadDataLoader.find({
        collection: postsSlug,
        overrideAccess: true,
        pagination: false,
        req: branchRequest,
        where: { id: { equals: post.id } },
      })
    }

    const firstBranchResult = await findOnBranch('first-cache-branch')
    const secondBranchResult = await findOnBranch('second-cache-branch')

    expect(firstBranchResult.docs[0]?.title).toBe('first branch title')
    expect(secondBranchResult.docs[0]?.title).toBe('second branch title')
  })
})
