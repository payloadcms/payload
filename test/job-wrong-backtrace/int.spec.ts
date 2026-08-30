import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Reproduction: Jobs wrap handler errors in TaskError / WorkflowError and drop
 * the original stack. The persisted job error should include the application
 * handler frames (`throwFromTaskHandler` / `throwFromWorkflowHandler`), not
 * only `getRunTaskFunction`.
 */
describe('job handler error stack traces', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload?.destroy()
  })

  it('should persist the task handler file in the job log stack', async () => {
    const job = await payload.jobs.queue({
      task: 'throwFromTaskHandler',
      input: {},
    })

    await payload.jobs.run({ silent: true })

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    const stack = jobAfterRun.log?.[0]?.error?.stack as string | undefined

    expect(jobAfterRun.hasError).toBe(true)
    expect(jobAfterRun.log?.[0]?.error?.message).toBe('unique-marker-task-handler-failure')
    expect(stack).toBeDefined()
    expect(stack).toMatch(/throwFromTaskHandler/)
  })

  it('should persist the workflow handler file in the job error stack', async () => {
    const job = await payload.jobs.queue({
      workflow: 'throwFromWorkflowHandler',
      input: {},
    })

    await payload.jobs.run({ silent: true })

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    const stack = jobAfterRun.error?.stack as string | undefined

    expect(jobAfterRun.hasError).toBe(true)
    expect(jobAfterRun.error?.message).toBe('unique-marker-workflow-handler-failure')
    expect(stack).toBeDefined()
    expect(stack).toMatch(/throwFromWorkflowHandler/)
  })
})
