/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */

import type { Payload, PayloadRequest } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import { hookSpy } from './hookSpy.js'
import { branchesSlug, restrictedSlug } from './shared.js'

test.suite('Scheduled merge access', { config: './config.ts' }, () => {
  test.afterEach(() => {
    hookSpy.branchValidation = undefined
  })

  test('should check an explicit merging user instead of the request user', async ({ payload }) => {
    const { admin, branch, doc, editor } = await createPendingChange({ payload })
    const req = await createPayloadRequest({ payload, user: admin })

    const result = await payload.branches.merge({
      branch: branch.slug,
      overrideAccess: false,
      req,
      user: editor,
    })

    expect(result.blocked).toHaveLength(1)
    expect(result.merged).toHaveLength(0)
    expect(req.user).toEqual(admin)

    const onMain = await payload.findByID({
      id: doc.id,
      collection: restrictedSlug,
      overrideAccess: true,
    })

    expect(onMain.title).toBe('original on main')
  })

  test('should check an explicit discarding user instead of the request user', async ({
    payload,
  }) => {
    const { admin, branch, editor } = await createPendingChange({ payload })
    const req = await createPayloadRequest({ payload, user: admin })

    await expect(
      payload.branches.discard({
        branch: branch.slug,
        overrideAccess: false,
        req,
        user: editor,
      }),
    ).rejects.toThrow()

    expect(req.user).toEqual(admin)
  })

  test('should fail an access-refused job run by an authenticated admin', async ({ payload }) => {
    const { admin, branch, doc, editor } = await createPendingChange({ payload })
    const req = await createPayloadRequest({ payload, user: admin })
    const jobID = await runScheduledMerge({
      branch: branch.slug,
      payload,
      req,
      userID: editor.id,
    })
    const job = await payload.findByID({
      id: jobID,
      collection: 'payload-jobs',
      overrideAccess: true,
    })
    const onMain = await payload.findByID({
      id: doc.id,
      collection: restrictedSlug,
      overrideAccess: true,
    })
    const afterMerge = await payload.findByID({
      id: branch.id,
      collection: branchesSlug,
      overrideAccess: true,
    })

    expect(job.hasError).toBe(true)
    expect(job.completedAt).toBeFalsy()
    expect(job.error?.message).toContain(`Scheduled merge of branch "${branch.slug}" was refused:`)
    expect(onMain.title).toBe('original on main')
    expect(afterMerge.mergeProgress).toBeFalsy()
    expect(afterMerge.status).toBe('open')
    expect(req.user).toEqual(admin)
  })

  test('should preserve validation refusal details in the failed job', async ({ payload }) => {
    const { admin, branch, doc } = await createPendingChange({ payload })
    const req = await createPayloadRequest({ payload, user: admin })
    const message = 'The campaign has not been approved.'

    hookSpy.branchValidation = ({ candidates }) => ({
      errors: [{ changeID: candidates[0]!.changeID, message }],
      valid: false,
    })

    const jobID = await runScheduledMerge({
      branch: branch.slug,
      payload,
      req,
      userID: admin.id,
    })
    const job = await payload.findByID({
      id: jobID,
      collection: 'payload-jobs',
      overrideAccess: true,
    })
    const onMain = await payload.findByID({
      id: doc.id,
      collection: restrictedSlug,
      overrideAccess: true,
    })
    const afterMerge = await payload.findByID({
      id: branch.id,
      collection: branchesSlug,
      overrideAccess: true,
    })

    expect(job.hasError).toBe(true)
    expect(job.error?.message).toContain(message)
    expect(onMain.title).toBe('original on main')
    expect(afterMerge.mergeProgress).toBeFalsy()
  })

  test('should use the scheduling admin permissions when the runner has fewer permissions', async ({
    payload,
  }) => {
    const { admin, branch, doc, editor } = await createPendingChange({ payload })
    const req = await createPayloadRequest({ payload, user: editor })

    await runScheduledMerge({ branch: branch.slug, payload, req, userID: admin.id })

    const onMain = await payload.findByID({
      id: doc.id,
      collection: restrictedSlug,
      overrideAccess: true,
    })

    expect(onMain.title).toBe('edited on branch')
    expect(req.user).toEqual(editor)
  })

  test('should complete a scheduled merge when no changes remain pending', async ({ payload }) => {
    const { admin, branch } = await createPendingChange({ payload })

    await payload.branches.discard({ branch: branch.slug, overrideAccess: true })

    const req = await createPayloadRequest({ payload, user: admin })
    const jobID = await runScheduledMerge({
      branch: branch.slug,
      payload,
      req,
      userID: admin.id,
    })
    const job = await payload.findByID({
      id: jobID,
      collection: 'payload-jobs',
      disableErrors: true,
      overrideAccess: true,
    })

    expect(job).toBeNull()
  })
})

const createPendingChange = async ({ payload }: { payload: Payload }) => {
  const editor = await payload.create({
    collection: 'users',
    data: { email: 'editor@example.com', password: 'test' },
    overrideAccess: true,
  })
  const admin = (
    await payload.find({
      collection: 'users',
      overrideAccess: true,
      where: { email: { equals: devUser.email } },
    })
  ).docs[0]!
  const branch = await payload.create({
    collection: branchesSlug,
    data: { name: 'Scheduled access regression' },
    overrideAccess: true,
  })
  const doc = await payload.create({
    collection: restrictedSlug,
    data: { title: 'original on main' },
    overrideAccess: true,
  })

  await payload.update({
    id: doc.id,
    branch: branch.slug,
    collection: restrictedSlug,
    data: { title: 'edited on branch' },
    overrideAccess: true,
  })

  return {
    admin: { ...admin, collection: 'users' } as const,
    branch,
    doc,
    editor: { ...editor, collection: 'users' } as const,
  }
}

const runScheduledMerge = async ({
  branch,
  payload,
  req,
  userID,
}: {
  branch: string
  payload: Payload
  req: PayloadRequest
  userID: number | string
}) => {
  const job = await payload.jobs.queue({
    input: { branch, user: { relationTo: 'users', value: userID } },
    overrideAccess: true,
    task: 'scheduleMerge',
    waitUntil: new Date(Date.now() - 60_000),
  })

  await payload.jobs.runByID({ id: job.id, overrideAccess: true, req })

  return job.id
}
