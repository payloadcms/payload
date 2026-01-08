import path from 'path'
import {
  _internal_jobSystemGlobals,
  _internal_resetJobSystemGlobals,
  createLocalReq,
  Forbidden,
  type JobTaskStatus,
  type Payload,
  type TypedUser,
} from 'payload'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { clearAndSeedEverything } from './seed.js'
import { waitUntilAutorunIsDone } from './utilities.js'

const { email, password } = devUser
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Queues - Payload', () => {
  let payload: Payload
  let restClient: NextRESTClient
  let token: string
  let user: TypedUser

  beforeAll(async () => {
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    // Ensure no new crons are scheduled
    _internal_jobSystemGlobals.shouldAutoRun = false
    _internal_jobSystemGlobals.shouldAutoSchedule = false
    // Wait 3 seconds to ensure all currently-running crons are done. If we shut down the db while a function is running, it can cause issues
    // Cron function runs may persist after a test has finished
    await wait(3000)
    // Now we can destroy the payload instance
    await payload.destroy()
    _internal_resetJobSystemGlobals()
  })

  afterEach(() => {
    _internal_resetJobSystemGlobals()
  })

  beforeEach(async () => {
    // Set autorun to false during seed process to ensure no crons are scheduled, which may affect the tests
    _internal_jobSystemGlobals.shouldAutoRun = false
    _internal_jobSystemGlobals.shouldAutoSchedule = false
    await clearAndSeedEverything(payload)
    const data = await restClient
      .POST('/users/login', {
        body: JSON.stringify({
          email,
          password,
        }),
      })
      .then((res) => res.json())

    if (data.token) {
      token = data.token
    }
    user = data.user
    payload.config.jobs.deleteJobOnComplete = true
    _internal_jobSystemGlobals.shouldAutoRun = true
    _internal_jobSystemGlobals.shouldAutoSchedule = true
  })

  describe('access control', () => {
    it('will run access control on jobs runner run endpoint', async () => {
      const response = await restClient.GET('/payload-jobs/run?silent=true', {
        headers: {
          // Authorization: `JWT ${token}`,
        },
      }) // Needs to be a rest call to test auth
      expect(response.status).toBe(401)
    })
    it('will return 200 from jobs runner', async () => {
      const response = await restClient.GET('/payload-jobs/run?silent=true', {
        headers: {
          Authorization: `JWT ${token}`,
        },
      }) // Needs to be a rest call to test auth

      expect(response.status).toBe(200)
    })

    it('will fail access control on local api .queue when passing overrideAccess: false', async () => {
      await expect(
        payload.jobs.queue({
          task: 'CreateSimple',
          input: {
            message: 'from single task',
          },
          overrideAccess: false,
        }),
      ).rejects.toThrow(Forbidden)
    })

    it('will pass access control on local api .queue when passing overrideAccess: false', async () => {
      const req = await createLocalReq({ user }, payload)
      const result = await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
        overrideAccess: false,
        req,
      })

      expect(result).toBeDefined()
      expect(result.input.message).toBe('from single task')
    })

    it('will fail access control on local api .run when passing overrideAccess: false', async () => {
      await expect(
        payload.jobs.run({
          overrideAccess: false,
        }),
      ).rejects.toThrow(Forbidden)
    })

    it('will pass access control on local api .run when passing overrideAccess: false', async () => {
      const req = await createLocalReq({ user }, payload)
      const result = await payload.jobs.run({
        overrideAccess: false,
        req,
      })

      expect(result).toBeDefined()
    })

    it('will fail access control on local api .runByID when passing overrideAccess: false', async () => {
      await expect(
        payload.jobs.runByID({
          id: '1',
          overrideAccess: false,
        }),
      ).rejects.toThrow(Forbidden)
    })

    it('will pass access control on local api .runByID when passing overrideAccess: false', async () => {
      const req = await createLocalReq({ user }, payload)

      // Queue a job first so we have a valid ID
      const job = await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })

      const result = await payload.jobs.runByID({
        id: job.id,
        overrideAccess: false,
        req,
        silent: true,
      })

      expect(result).toBeDefined()
    })

    it('will fail access control on local api .cancel when passing overrideAccess: false', async () => {
      payload.config.jobs.deleteJobOnComplete = false

      // Queue a job without running it
      const job = await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })

      await expect(
        payload.jobs.cancel({
          where: {
            id: {
              equals: job.id,
            },
          },
          overrideAccess: false,
        }),
      ).rejects.toThrow(Forbidden)

      // Verify the job was NOT cancelled
      const jobAfterCancel = await payload.findByID({
        collection: 'payload-jobs',
        id: job.id,
      })

      expect(jobAfterCancel.hasError).toBe(false)
      // @ts-expect-error error is not typed
      expect(jobAfterCancel.error?.cancelled).toBeUndefined()
    })

    it('will pass access control on local api .cancel when passing overrideAccess: false', async () => {
      payload.config.jobs.deleteJobOnComplete = false

      const req = await createLocalReq({ user }, payload)

      // Queue a job without running it
      const job = await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })

      await payload.jobs.cancel({
        where: {
          id: {
            equals: job.id,
          },
        },
        overrideAccess: false,
        req,
      })

      // Verify the job was cancelled
      const jobAfterCancel = await payload.findByID({
        collection: 'payload-jobs',
        id: job.id,
      })

      expect(jobAfterCancel.hasError).toBe(true)
      // @ts-expect-error error is not typed
      expect(jobAfterCancel.error?.cancelled).toBe(true)
    })

    it('will fail access control on local api .cancelByID when passing overrideAccess: false', async () => {
      payload.config.jobs.deleteJobOnComplete = false

      // Queue a job without running it
      const job = await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })

      await expect(
        payload.jobs.cancelByID({
          id: job.id,
          overrideAccess: false,
        }),
      ).rejects.toThrow(Forbidden)

      // Verify the job was NOT cancelled
      const jobAfterCancel = await payload.findByID({
        collection: 'payload-jobs',
        id: job.id,
      })

      expect(jobAfterCancel.hasError).toBe(false)
      // @ts-expect-error error is not typed
      expect(jobAfterCancel.error?.cancelled).toBeUndefined()
    })

    it('will pass access control on local api .cancelByID when passing overrideAccess: false', async () => {
      payload.config.jobs.deleteJobOnComplete = false

      const req = await createLocalReq({ user }, payload)

      // Queue a job without running it
      const job = await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })

      await payload.jobs.cancelByID({
        id: job.id,
        overrideAccess: false,
        req,
      })

      // Verify the job was cancelled
      const jobAfterCancel = await payload.findByID({
        collection: 'payload-jobs',
        id: job.id,
      })

      expect(jobAfterCancel.hasError).toBe(true)
      // @ts-expect-error error is not typed
      expect(jobAfterCancel.error?.cancelled).toBe(true)
    })
  })

  // There used to be a bug in payload where updating the job threw the following error - only in
  // postgres:
  // QueryError: The following path cannot be queried: document.relationTo
  // This test is to ensure that the bug is fixed
  it('can create and update new jobs', async () => {
    const job = await payload.create({
      collection: 'payload-jobs',
      data: {
        input: {
          message: '1',
        },
      },
    })
    // @ts-expect-error
    expect(job.input.message).toBe('1')

    const updatedJob = await payload.update({
      collection: 'payload-jobs',
      id: job.id,
      data: {
        input: {
          message: '2',
        },
      },
    })
    // @ts-expect-error
    expect(updatedJob.input.message).toBe('2')
  })

  it('can create new jobs', async () => {
    const newPost = await payload.create({
      collection: 'posts',
      data: {
        title: 'my post',
      },
    })

    const retrievedPost = await payload.findByID({
      collection: 'posts',
      id: newPost.id,
    })

    expect(retrievedPost.jobStep1Ran).toBeFalsy()
    expect(retrievedPost.jobStep2Ran).toBeFalsy()

    await payload.jobs.run({ silent: true })

    const postAfterJobs = await payload.findByID({
      collection: 'posts',
      id: newPost.id,
    })

    expect(postAfterJobs.jobStep1Ran).toBe('hello')
    expect(postAfterJobs.jobStep2Ran).toBe('hellohellohellohello')
  })

  it('can create new JSON-workflow jobs', async () => {
    const newPost = await payload.create({
      collection: 'posts',
      data: {
        title: 'my post',
      },
      context: {
        useJSONWorkflow: true,
      },
    })

    const retrievedPost = await payload.findByID({
      collection: 'posts',
      id: newPost.id,
    })

    expect(retrievedPost.jobStep1Ran).toBeFalsy()
    expect(retrievedPost.jobStep2Ran).toBeFalsy()

    await payload.jobs.run({ silent: true })

    const postAfterJobs = await payload.findByID({
      collection: 'posts',
      id: newPost.id,
    })

    expect(postAfterJobs.jobStep1Ran).toBe('hello')
    expect(postAfterJobs.jobStep2Ran).toBe('hellohellohellohello')
  })

  it('ensure job retrying works', async () => {
    payload.config.jobs.deleteJobOnComplete = false
    const job = await payload.jobs.queue({
      workflow: 'retriesTest',
      queue: 'default',
      input: {
        message: 'hello',
      },
    })

    let hasJobsRemaining = true

    while (hasJobsRemaining) {
      const response = await payload.jobs.run({ silent: true })

      if (response.noJobsRemaining) {
        hasJobsRemaining = false
      }
    }

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    // @ts-expect-error amountRetried is new arbitrary data and not in the type
    expect(jobAfterRun.input.amountRetried).toBe(3)
  })

  it('ensure workflow-level retries are respected', async () => {
    payload.config.jobs.deleteJobOnComplete = false
    const job = await payload.jobs.queue({
      workflow: 'retriesWorkflowLevelTest',
      input: {
        message: 'hello',
      },
    })

    let hasJobsRemaining = true

    while (hasJobsRemaining) {
      const response = await payload.jobs.run({ silent: true })

      if (response.noJobsRemaining) {
        hasJobsRemaining = false
      }
    }

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    // @ts-expect-error amountRetried is new arbitrary data and not in the type
    expect(jobAfterRun.input.amountRetried).toBe(2)
  })

  it('ensure workflows dont limit retries if no retries property is set', async () => {
    payload.config.jobs.deleteJobOnComplete = false
    const job = await payload.jobs.queue({
      workflow: 'workflowNoRetriesSet',
      input: {
        message: 'hello',
      },
    })

    let hasJobsRemaining = true

    while (hasJobsRemaining) {
      const response = await payload.jobs.run({ silent: true })

      if (response.noJobsRemaining) {
        hasJobsRemaining = false
      }
    }

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    // @ts-expect-error amountRetried is new arbitrary data and not in the type
    expect(jobAfterRun.input.amountRetried).toBe(3)
  })

  it('ensure workflows dont retry if retries set to 0, even if individual tasks have retries > 0 set', async () => {
    payload.config.jobs.deleteJobOnComplete = false
    const job = await payload.jobs.queue({
      workflow: 'workflowRetries0',
      input: {
        message: 'hello',
      },
    })

    let hasJobsRemaining = true

    while (hasJobsRemaining) {
      const response = await payload.jobs.run({ silent: true })

      if (response.noJobsRemaining) {
        hasJobsRemaining = false
      }
    }

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    // @ts-expect-error amountRetried is new arbitrary data and not in the type
    expect(jobAfterRun.input.amountRetried).toBe(0)
  })

  it('ensure workflows dont retry if neither workflows nor tasks have retries set', async () => {
    payload.config.jobs.deleteJobOnComplete = false
    const job = await payload.jobs.queue({
      workflow: 'workflowAndTasksRetriesUndefined',
      input: {
        message: 'hello',
      },
    })

    let hasJobsRemaining = true

    while (hasJobsRemaining) {
      const response = await payload.jobs.run({ silent: true })

      if (response.noJobsRemaining) {
        hasJobsRemaining = false
      }
    }

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    // @ts-expect-error amountRetried is new arbitrary data and not in the type
    expect(jobAfterRun.input.amountRetried).toBe(0)
  })

  it('ensure workflows retry if workflows have retries set and tasks do not have retries set, due to tasks inheriting workflow retries', async () => {
    payload.config.jobs.deleteJobOnComplete = false
    const job = await payload.jobs.queue({
      workflow: 'workflowRetries2TasksRetriesUndefined',
      input: {
        message: 'hello',
      },
    })

    let hasJobsRemaining = true

    while (hasJobsRemaining) {
      const response = await payload.jobs.run({ silent: true })

      if (response.noJobsRemaining) {
        hasJobsRemaining = false
      }
    }

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    // @ts-expect-error amountRetried is new arbitrary data and not in the type
    expect(jobAfterRun.input.amountRetried).toBe(2)
  })

  it('ensure workflows do not retry if workflows have retries set and tasks have retries set to 0', async () => {
    payload.config.jobs.deleteJobOnComplete = false
    const job = await payload.jobs.queue({
      workflow: 'workflowRetries2TasksRetries0',
      input: {
        message: 'hello',
      },
    })

    let hasJobsRemaining = true

    while (hasJobsRemaining) {
      const response = await payload.jobs.run({ silent: true })

      if (response.noJobsRemaining) {
        hasJobsRemaining = false
      }
    }

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    // @ts-expect-error amountRetried is new arbitrary data and not in the type
    expect(jobAfterRun.input.amountRetried).toBe(0)
  })

  // Task rollbacks are not supported in the current version of Payload. This test will be re-enabled when task rollbacks are supported once we figure out the transaction issues
  it.skip('ensure failed tasks are rolled back via transactions', async () => {
    const job = await payload.jobs.queue({
      workflow: 'retriesRollbackTest',
      input: {
        message: 'hello',
      },
    })

    let hasJobsRemaining = true

    while (hasJobsRemaining) {
      const response = await payload.jobs.run({ silent: true })

      if (response.noJobsRemaining) {
        hasJobsRemaining = false
      }
    }

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1) // Failure happens after task creates a simple document, but still within the task => any document creation should be rolled back

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    // @ts-expect-error amountRetried is new arbitrary data and not in the type
    expect(jobAfterRun.input.amountRetried).toBe(4)
  })

  it('ensure backoff strategy of task is respected', async () => {
    payload.config.jobs.deleteJobOnComplete = false
    const job = await payload.jobs.queue({
      workflow: 'retriesBackoffTest',
      input: {
        message: 'hello',
      },
    })

    let hasJobsRemaining = true
    let firstGotNoJobs = null

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    // Keep running until no jobs found. If no jobs found, wait for 1.6 seconds to see if any new jobs are added
    // (Specifically here we want to see if the backoff strategy is respected and thus need to wait for `waitUntil`)
    while (
      hasJobsRemaining ||
      !firstGotNoJobs ||
      new Date().getTime() - firstGotNoJobs.getTime() < 3000
    ) {
      const response = await payload.jobs.run({ silent: true })

      if (response.noJobsRemaining) {
        if (hasJobsRemaining) {
          firstGotNoJobs = new Date()
          hasJobsRemaining = false
        }
      } else {
        firstGotNoJobs = null
        hasJobsRemaining = true
      }

      // Add a 100ms delay before the next iteration
      await delay(100)
    }

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })
    expect(jobAfterRun.totalTried).toBe(5)
    expect((jobAfterRun.taskStatus as JobTaskStatus).inline?.['1']?.totalTried).toBe(5)

    // @ts-expect-error amountRetried is new arbitrary data and not in the type
    expect(jobAfterRun.input.amountRetried).toBe(4)

    /*
    Job.input.timeTried may look something like this:
    timeTried: {
            '0': '2024-10-07T16:05:49.300Z',
            '1': '2024-10-07T16:05:49.469Z',
            '2': '2024-10-07T16:05:49.779Z',
            '3': '2024-10-07T16:05:50.388Z',
            '4': '2024-10-07T16:05:51.597Z'
          }
     Convert this into an array, each item is the duration between the fails. So this should have 4 items
    */
    const timeTried: {
      [key: string]: string
      // @ts-expect-error timeTried is new arbitrary data and not in the type
    } = jobAfterRun.input.timeTried

    const durations = Object.values(timeTried)
      .map((time, index, arr) => {
        if (index === arr.length - 1) {
          return null
        }
        return new Date(arr[index + 1] as string).getTime() - new Date(time).getTime()
      })
      .filter((p) => p !== null)

    expect(durations).toHaveLength(4)
    expect(durations[0]).toBeGreaterThan(300)
    expect(durations[1]).toBeGreaterThan(600)
    expect(durations[2]).toBeGreaterThan(1200)
    expect(durations[3]).toBeGreaterThan(2400)
  })

  it('ensure jobs run in FIFO order by default', async () => {
    await payload.jobs.queue({
      workflow: 'inlineTaskTestDelayed',
      input: {
        message: 'task 1',
      },
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    await payload.jobs.queue({
      workflow: 'inlineTaskTestDelayed',
      input: {
        message: 'task 2',
      },
    })

    await payload.jobs.run({
      sequential: true,
      silent: true,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
      sort: 'createdAt',
    })

    expect(allSimples.totalDocs).toBe(2)
    expect(allSimples.docs?.[0]?.title).toBe('task 1')
    expect(allSimples.docs?.[1]?.title).toBe('task 2')
  })

  it('ensure jobs can run LIFO if processingOrder is passed', async () => {
    await payload.jobs.queue({
      workflow: 'inlineTaskTestDelayed',
      input: {
        message: 'task 1',
      },
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    await payload.jobs.queue({
      workflow: 'inlineTaskTestDelayed',
      input: {
        message: 'task 2',
      },
    })

    await payload.jobs.run({
      sequential: true,
      silent: true,
      processingOrder: '-createdAt',
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
      sort: 'createdAt',
    })

    expect(allSimples.totalDocs).toBe(2)
    expect(allSimples.docs?.[0]?.title).toBe('task 2')
    expect(allSimples.docs?.[1]?.title).toBe('task 1')
  })

  it('ensure job config processingOrder using queues object is respected', async () => {
    await payload.jobs.queue({
      workflow: 'inlineTaskTestDelayed',
      queue: 'lifo',
      input: {
        message: 'task 1',
      },
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    await payload.jobs.queue({
      workflow: 'inlineTaskTestDelayed',
      queue: 'lifo',
      input: {
        message: 'task 2',
      },
    })

    await payload.jobs.run({
      sequential: true,
      silent: true,
      queue: 'lifo',
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
      sort: 'createdAt',
    })

    expect(allSimples.totalDocs).toBe(2)
    expect(allSimples.docs?.[0]?.title).toBe('task 2')
    expect(allSimples.docs?.[1]?.title).toBe('task 1')
  })

  it('can create new inline jobs', async () => {
    await payload.jobs.queue({
      workflow: 'inlineTaskTest',
      input: {
        message: 'hello!',
      },
    })

    await payload.jobs.run({ silent: true })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples.docs[0]?.title).toBe('hello!')
  })

  it('should respect deleteJobOnComplete true default configuration', async () => {
    const { id } = await payload.jobs.queue({
      workflow: 'inlineTaskTest',
      input: {
        message: 'deleteJobOnComplete test',
      },
    })

    const before = await payload.findByID({ collection: 'payload-jobs', id, disableErrors: true })
    expect(before?.id).toBe(id)

    await payload.jobs.run({ silent: true })

    const after = await payload.findByID({ collection: 'payload-jobs', id, disableErrors: true })
    expect(after).toBeNull()
  })

  it('should not delete failed jobs if deleteJobOnComplete is true', async () => {
    const { id } = await payload.jobs.queue({
      workflow: 'failsImmediately',
      input: {},
    })

    const before = await payload.findByID({ collection: 'payload-jobs', id, disableErrors: true })
    expect(before?.id).toBe(id)

    await payload.jobs.run({ silent: true })

    const after = await payload.findByID({ collection: 'payload-jobs', id, disableErrors: true })
    expect(after?.id).toBe(id)
  })

  it('should respect deleteJobOnComplete false configuration', async () => {
    payload.config.jobs.deleteJobOnComplete = false
    const { id } = await payload.jobs.queue({
      workflow: 'inlineTaskTest',
      input: {
        message: 'hello!',
      },
    })

    const before = await payload.findByID({ collection: 'payload-jobs', id, disableErrors: true })
    expect(before?.id).toBe(id)

    await payload.jobs.run({ silent: true })

    const after = await payload.findByID({ collection: 'payload-jobs', id, disableErrors: true })
    expect(after?.id).toBe(id)
  })

  it('can queue single tasks', async () => {
    await payload.jobs.queue({
      task: 'CreateSimple',
      input: {
        message: 'from single task',
      },
    })

    await payload.jobs.run({ silent: true })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples.docs[0]?.title).toBe('from single task')
  })

  it('can queue and run via the endpoint single tasks without workflows', async () => {
    const workflowsRef = payload.config.jobs.workflows
    delete payload.config.jobs.workflows
    await payload.jobs.queue({
      task: 'CreateSimple',
      input: {
        message: 'from single task',
      },
    })

    await restClient.GET('/payload-jobs/run?silent=true', {
      headers: {
        Authorization: `JWT ${token}`,
      },
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples.docs[0]?.title).toBe('from single task')
    payload.config.jobs.workflows = workflowsRef
  })

  // Task rollbacks are not supported in the current version of Payload. This test will be re-enabled when task rollbacks are supported once we figure out the transaction issues
  it.skip('transaction test against payload-jobs collection', async () => {
    // This kinds of emulates what happens when multiple jobs are queued and then run in parallel.
    const runWorkflowFN = async (i: number) => {
      const { id } = await payload.create({
        collection: 'payload-jobs',
        data: {
          input: {
            message: 'Number ' + i,
          },
          taskSlug: 'CreateSimple',
        },
      })

      const _req = await createLocalReq({}, payload)
      const t1Req = isolateObjectProperty(_req, 'transactionID')
      delete t1Req.transactionID

      await initTransaction(t1Req)

      await payload.update({
        collection: 'payload-jobs',
        id,
        req: t1Req,
        data: {
          input: {
            message: 'Number ' + i + ' Update 1',
          },
          processing: true,
          taskSlug: 'CreateSimple',
        },
      })

      /**
       * T1 start
       */

      const t2Req = isolateObjectProperty(t1Req, 'transactionID')
      delete t2Req.transactionID
      //
      await initTransaction(t2Req)

      await payload.update({
        collection: 'payload-jobs',
        id,
        req: t1Req,
        data: {
          input: {
            message: 'Number ' + i + ' Update 2',
          },
          processing: true,
          taskSlug: 'CreateSimple',
        },
      })

      await payload.create({
        collection: 'simple',
        req: t2Req,
        data: {
          title: 'from single task',
        },
      })

      await payload.update({
        collection: 'payload-jobs',
        id,
        req: t1Req,
        data: {
          input: {
            message: 'Number ' + i + ' Update 3',
          },
          processing: true,
          taskSlug: 'CreateSimple',
        },
      })

      await commitTransaction(t2Req)

      /**
       * T1 end
       */

      await payload.update({
        collection: 'payload-jobs',
        id,
        req: t1Req,
        data: {
          input: {
            message: 'Number ' + i + ' Update 4',
          },
          processing: true,
          taskSlug: 'CreateSimple',
        },
      })
      await commitTransaction(t1Req)
    }

    await Promise.all(
      new Array(30).fill(0).map(async (_, i) => {
        await runWorkflowFN(i)
      }),
    )

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(30)
  })

  it('can queue single tasks 8 times', async () => {
    for (let i = 0; i < 8; i++) {
      await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })
    }

    await payload.jobs.run({ silent: true })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(8)
    expect(allSimples.docs[0]?.title).toBe('from single task')
    expect(allSimples.docs[7]?.title).toBe('from single task')
  })

  it('can queue single tasks hundreds of times', async () => {
    const numberOfTasks = 150
    // TODO: Ramp up the limit from 150 to 500 or 1000, to test reliability of the database
    payload.config.jobs.deleteJobOnComplete = false
    for (let i = 0; i < numberOfTasks; i++) {
      await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })
    }

    await payload.jobs.run({
      silent: true,
      limit: numberOfTasks,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: numberOfTasks,
    })

    expect(allSimples.totalDocs).toBe(numberOfTasks) // Default limit: 10
    expect(allSimples.docs[0]?.title).toBe('from single task')
    expect(allSimples.docs[numberOfTasks - 1]?.title).toBe('from single task')
  })

  it('ensure default jobs run limit of 10 works', async () => {
    for (let i = 0; i < 65; i++) {
      await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })
    }

    await payload.jobs.run({ silent: true })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 1000,
    })

    expect(allSimples.totalDocs).toBe(10) // Default limit: 10
    expect(allSimples.docs[0]?.title).toBe('from single task')
    expect(allSimples.docs[9]?.title).toBe('from single task')
  })

  it('ensure jobs run limit can be customized', async () => {
    for (let i = 0; i < 110; i++) {
      await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })
    }

    await payload.jobs.run({
      limit: 42,
      silent: true,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 1000,
    })

    expect(allSimples.totalDocs).toBe(42) // Default limit: 10
    expect(allSimples.docs[0]?.title).toBe('from single task')
    expect(allSimples.docs[30]?.title).toBe('from single task')
    expect(allSimples.docs[41]?.title).toBe('from single task')
  })

  it('can queue different kinds of single tasks multiple times', async () => {
    for (let i = 0; i < 3; i++) {
      await payload.jobs.queue({
        task: 'CreateSimpleWithDuplicateMessage',
        input: {
          message: 'hello',
        },
      })
      await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })
      await payload.jobs.queue({
        task: 'CreateSimpleWithDuplicateMessage',
        input: {
          message: 'hello',
        },
      })
    }

    await payload.jobs.run({ silent: true })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(9)

    let amountOfCreateSimple = 0
    let amountOfCreateSimpleWithDuplicateMessage = 0

    for (const simple of allSimples.docs) {
      if (simple.title === 'from single task') {
        amountOfCreateSimple++
      } else if (simple.title === 'hellohello') {
        amountOfCreateSimpleWithDuplicateMessage++
      }
    }

    expect(amountOfCreateSimple).toBe(3)
    expect(amountOfCreateSimpleWithDuplicateMessage).toBe(6)
  })

  it('can queue external tasks', async () => {
    await payload.jobs.queue({
      task: 'ExternalTask',
      input: {
        message: 'external',
      },
    })

    await payload.jobs.run({ silent: true })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples.docs[0]?.title).toBe('external')
  })

  it('can queue external workflow that is running external task', async () => {
    await payload.jobs.queue({
      workflow: 'externalWorkflow',
      input: {
        message: 'externalWorkflow',
      },
    })

    await payload.jobs.run({ silent: true })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples.docs[0]?.title).toBe('externalWorkflow')
  })

  it('ensure payload.jobs.runByID works and only runs the specified job', async () => {
    payload.config.jobs.deleteJobOnComplete = false

    let lastJobID: null | number | string = null
    for (let i = 0; i < 3; i++) {
      const job = await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })
      lastJobID = job.id
    }
    if (!lastJobID) {
      throw new Error('No job ID found after queuing jobs')
    }

    await payload.jobs.runByID({
      id: lastJobID,
      silent: true,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples.docs[0]?.title).toBe('from single task')

    const allCompletedJobs = await payload.find({
      collection: 'payload-jobs',
      limit: 100,
      where: {
        completedAt: {
          exists: true,
        },
      },
    })

    expect(allCompletedJobs.totalDocs).toBe(1)
    expect(allCompletedJobs.docs[0]?.id).toBe(lastJobID)
  })

  it('ensure where query for id in payload.jobs.run works and only runs the specified job', async () => {
    payload.config.jobs.deleteJobOnComplete = false

    let lastJobID: null | number | string = null
    for (let i = 0; i < 3; i++) {
      const job = await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })
      lastJobID = job.id
    }
    if (!lastJobID) {
      throw new Error('No job ID found after queuing jobs')
    }

    await payload.jobs.run({
      silent: true,
      where: {
        id: {
          equals: lastJobID,
        },
      },
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples.docs[0]?.title).toBe('from single task')

    const allCompletedJobs = await payload.find({
      collection: 'payload-jobs',
      limit: 100,
      where: {
        completedAt: {
          exists: true,
        },
      },
    })

    expect(allCompletedJobs.totalDocs).toBe(1)
    expect(allCompletedJobs.docs[0]?.id).toBe(lastJobID)
  })

  it('ensure where query for input data in payload.jobs.run works and only runs the specified job', async () => {
    payload.config.jobs.deleteJobOnComplete = false

    for (let i = 0; i < 3; i++) {
      await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: `from single task ${i}`,
        },
      })
    }

    await payload.jobs.run({
      silent: true,
      where: {
        'input.message': {
          equals: 'from single task 2',
        },
      },
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples.docs[0]?.title).toBe('from single task 2')

    const allCompletedJobs = await payload.find({
      collection: 'payload-jobs',
      limit: 100,
      where: {
        completedAt: {
          exists: true,
        },
      },
    })

    expect(allCompletedJobs.totalDocs).toBe(1)
    expect((allCompletedJobs.docs[0]?.input as any).message).toBe('from single task 2')
  })

  it('can run sub-tasks', async () => {
    payload.config.jobs.deleteJobOnComplete = false
    const job = await payload.jobs.queue({
      workflow: 'subTask',
      input: {
        message: 'hello!',
      },
    })

    await payload.jobs.run({ silent: true })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(2)
    expect(allSimples.docs[0]?.title).toBe('hello!')
    expect(allSimples.docs[1]?.title).toBe('hello!')

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    expect(jobAfterRun?.log?.[0]?.taskID).toBe('create doc 1')
    //expect(jobAfterRun.log[0].parent.taskID).toBe('create two docs')
    // jobAfterRun.log[0].parent should not exist
    expect(jobAfterRun?.log?.[0]?.parent).toBeUndefined()

    expect(jobAfterRun?.log?.[1]?.taskID).toBe('create doc 2')
    //expect(jobAfterRun.log[1].parent.taskID).toBe('create two docs')
    expect(jobAfterRun?.log?.[1]?.parent).toBeUndefined()

    expect(jobAfterRun?.log?.[2]?.taskID).toBe('create two docs')
  })

  it('ensure successful sub-tasks are not retried', async () => {
    payload.config.jobs.deleteJobOnComplete = false

    const job = await payload.jobs.queue({
      workflow: 'subTaskFails',
      input: {
        message: 'hello!',
      },
    })

    let hasJobsRemaining = true

    while (hasJobsRemaining) {
      const response = await payload.jobs.run({ silent: true })

      if (response.noJobsRemaining) {
        hasJobsRemaining = false
      }
    }

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples?.docs?.[0]?.title).toBe('hello!')

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    // @ts-expect-error
    expect(jobAfterRun.input.amountTask2Retried).toBe(3)
    // @ts-expect-error
    expect(jobAfterRun.input.amountTask1Retried).toBe(0)
  })

  it('ensure jobs can be cancelled using payload.jobs.cancelByID', async () => {
    payload.config.jobs.deleteJobOnComplete = false

    const job = await payload.jobs.queue({
      workflow: 'longRunning',
      input: {},
    })
    void payload.jobs.run({ silent: true }).catch((_ignored) => {})
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Should be in processing - ensure job is running
    const jobAfterRunProcessing = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
      depth: 0,
    })
    expect(jobAfterRunProcessing.processing).toBe(true)

    // Should be in processing - cancel job
    await payload.jobs.cancelByID({
      id: job.id,
    })

    // Wait 4 seconds. This ensures that the job has enough time to finish
    // if it hadn't been cancelled. That way we can be sure that the job was
    // actually cancelled.
    await new Promise((resolve) => setTimeout(resolve, 4000))

    // Ensure job is not completed and cancelled
    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
      depth: 0,
    })

    expect(Boolean(jobAfterRun.completedAt)).toBe(false)
    expect(jobAfterRun.hasError).toBe(true)
    // @ts-expect-error error is not typed
    expect(jobAfterRun.error?.cancelled).toBe(true)
    expect(jobAfterRun.processing).toBe(false)

    // Ensure job is not retried
    const runResponse = await payload.jobs.run({ silent: true })
    expect(runResponse.noJobsRemaining).toBe(true)
    expect(runResponse.jobStatus).toBeUndefined()
  })

  it('ensure jobs can be cancelled using payload.jobs.cancel', async () => {
    payload.config.jobs.deleteJobOnComplete = false

    const job = await payload.jobs.queue({
      workflow: 'longRunning',
      input: {},
    })
    void payload.jobs.run({ silent: true }).catch((_ignored) => {})
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Cancel all jobs
    await payload.jobs.cancel({
      where: {
        id: {
          exists: true,
        },
      },
    })

    // Wait 4 seconds. This ensures that the job has enough time to finish
    // if it hadn't been cancelled. That way we can be sure that the job was
    // actually cancelled.
    await new Promise((resolve) => setTimeout(resolve, 4000))

    // Ensure job is not completed and cancelled
    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
      depth: 0,
    })

    expect(Boolean(jobAfterRun.completedAt)).toBe(false)
    expect(jobAfterRun.hasError).toBe(true)
    // @ts-expect-error error is not typed
    expect(jobAfterRun.error?.cancelled).toBe(true)
    expect(jobAfterRun.processing).toBe(false)
  })

  it('ensure jobs can cancel themselves by throwing a JobCancelledError in workflow handler', async () => {
    payload.config.jobs.deleteJobOnComplete = false

    /**
     * First, verify that this job is retried if it simply failed
     */
    {
      const job = await payload.jobs.queue({
        workflow: 'selfCancel',
        input: {
          shouldCancel: false,
        },
      })
      const runResponse = await payload.jobs.run({ silent: true })
      expect(runResponse.remainingJobsFromQueried).toBe(1)
      expect(runResponse.jobStatus?.[job.id]?.status).toBe('error')

      const jobAfterRun = await payload.findByID({
        collection: 'payload-jobs',
        id: job.id,
        depth: 0,
      })

      // @ts-expect-error error is not typed
      expect(jobAfterRun.error?.message).toBe('Failed, not cancelled')
      expect(jobAfterRun.totalTried).toBe(1)
      expect(jobAfterRun.hasError).toBe(false)

      const runResponse2 = await payload.jobs.run({ silent: true })
      expect(runResponse2.remainingJobsFromQueried).toBe(1)
      expect(runResponse2.jobStatus?.[job.id]?.status).toBe('error')

      const jobAfterRun2 = await payload.findByID({
        collection: 'payload-jobs',
        id: job.id,
        depth: 0,
      })

      expect(jobAfterRun2.totalTried).toBe(2)
      expect(jobAfterRun2.hasError).toBe(false)
    }

    /**
     * Cleanup
     */
    await payload.db.deleteMany({
      collection: 'payload-jobs',
      where: {
        id: {
          exists: true,
        },
      },
    })

    /**
     * Now, verify the behavior when the job is cancelled by throwing a JobCancelledError in workflow handler
     */
    {
      const job = await payload.jobs.queue({
        workflow: 'selfCancel',
        input: {
          shouldCancel: true,
        },
      })

      const runResponse = await payload.jobs.run({ silent: true })
      expect(runResponse.remainingJobsFromQueried).toBe(0)
      expect(runResponse.jobStatus?.[job.id]?.status).toBe('error-reached-max-retries')

      const jobAfterRun = await payload.findByID({
        collection: 'payload-jobs',
        id: job.id,
        depth: 0,
      })

      expect(Boolean(jobAfterRun.completedAt)).toBe(false)
      expect(jobAfterRun.hasError).toBe(true)
      // @ts-expect-error error is not typed
      expect(jobAfterRun.error?.cancelled).toBe(true)
      expect(jobAfterRun.processing).toBe(false)

      // Run again to ensure the job is not retried
      const runResponse2 = await payload.jobs.run({ silent: true })
      expect(runResponse2.remainingJobsFromQueried).toBe(0)
      expect(runResponse2.jobStatus).toBeUndefined()

      const jobAfterRun2 = await payload.findByID({
        collection: 'payload-jobs',
        id: job.id,
        depth: 0,
      })

      expect(jobAfterRun2.totalTried).toBe(jobAfterRun.totalTried)
      expect(jobAfterRun2.hasError).toBe(true)
    }
  })

  it('ensure jobs can cancel themselves by throwing a JobCancelledError in task handler', async () => {
    payload.config.jobs.deleteJobOnComplete = false

    /**
     * First, verify that this job is retried if it simply failed
     */
    {
      const job = await payload.jobs.queue({
        task: 'SelfCancel',
        input: {
          shouldCancel: false,
        },
      })
      const runResponse = await payload.jobs.run({ silent: true })
      expect(runResponse.remainingJobsFromQueried).toBe(1)
      expect(runResponse.jobStatus?.[job.id]?.status).toBe('error')

      const jobAfterRun = await payload.findByID({
        collection: 'payload-jobs',
        id: job.id,
        depth: 0,
      })

      expect(jobAfterRun.log?.length).toBe(1)
      expect(jobAfterRun?.log?.[0]?.error?.message).toBe('Failed, not cancelled')
      expect(jobAfterRun.totalTried).toBe(1)
      expect(jobAfterRun.hasError).toBe(false)

      const runResponse2 = await payload.jobs.run({ silent: true })
      expect(runResponse2.remainingJobsFromQueried).toBe(1)
      expect(runResponse2.jobStatus?.[job.id]?.status).toBe('error')

      const jobAfterRun2 = await payload.findByID({
        collection: 'payload-jobs',
        id: job.id,
        depth: 0,
      })

      expect(jobAfterRun2.totalTried).toBe(2)
      expect(jobAfterRun2.hasError).toBe(false)
    }

    /**
     * Cleanup
     */
    await payload.db.deleteMany({
      collection: 'payload-jobs',
      where: {
        id: {
          exists: true,
        },
      },
    })

    /**
     * Now, verify the behavior when the job is cancelled by throwing a JobCancelledError in task handler
     */
    {
      const job = await payload.jobs.queue({
        task: 'SelfCancel',
        input: {
          shouldCancel: true,
        },
      })
      console.log('running job')

      const runResponse = await payload.jobs.run({ silent: true })
      console.log('runResponse', runResponse)
      expect(runResponse.remainingJobsFromQueried).toBe(0)
      expect(runResponse.jobStatus?.[job.id]?.status).toBe('error-reached-max-retries')

      const jobAfterRun = await payload.findByID({
        collection: 'payload-jobs',
        id: job.id,
        depth: 0,
      })

      expect(Boolean(jobAfterRun.completedAt)).toBe(false)
      expect(jobAfterRun.hasError).toBe(true)
      // @ts-expect-error error is not typed
      expect(jobAfterRun.error?.cancelled).toBe(true)
      expect(jobAfterRun.processing).toBe(false)

      // Run again to ensure the job is not retried
      const runResponse2 = await payload.jobs.run({ silent: true })
      expect(runResponse2.remainingJobsFromQueried).toBe(0)
      expect(runResponse2.jobStatus).toBeUndefined()

      const jobAfterRun2 = await payload.findByID({
        collection: 'payload-jobs',
        id: job.id,
        depth: 0,
      })

      expect(jobAfterRun2.totalTried).toBe(jobAfterRun.totalTried)
      expect(jobAfterRun2.hasError).toBe(true)
    }
  })

  it('can tasks throw error', async () => {
    payload.config.jobs.deleteJobOnComplete = false

    const job = await payload.jobs.queue({
      task: 'ThrowError',
      input: {},
    })

    await payload.jobs.run({ silent: true })

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    expect(jobAfterRun.hasError).toBe(true)
    expect(jobAfterRun.log?.length).toBe(1)
    expect(jobAfterRun?.log?.[0]?.error?.message).toBe('failed')
    expect(jobAfterRun?.log?.[0]?.state).toBe('failed')
  })

  it('can tasks return error', async () => {
    payload.config.jobs.deleteJobOnComplete = false

    const job = await payload.jobs.queue({
      task: 'ReturnError',
      input: {},
    })

    await payload.jobs.run({ silent: true })

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    expect(jobAfterRun.hasError).toBe(true)
    expect(jobAfterRun.log?.length).toBe(1)
    expect(jobAfterRun?.log?.[0]?.error?.message).toBe('Task handler returned a failed state')
    expect(jobAfterRun?.log?.[0]?.state).toBe('failed')
  })

  it('can tasks return error with custom error message', async () => {
    payload.config.jobs.deleteJobOnComplete = false

    const job = await payload.jobs.queue({
      task: 'ReturnCustomError',
      input: {
        errorMessage: 'custom error message',
      },
    })

    await payload.jobs.run({ silent: true })

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    expect(jobAfterRun.hasError).toBe(true)
    expect(jobAfterRun.log?.length).toBe(1)
    expect(jobAfterRun?.log?.[0]?.error?.message).toBe('custom error message')
    expect(jobAfterRun?.log?.[0]?.state).toBe('failed')
  })

  it('can reliably run workflows with parallel tasks', async () => {
    if (process.env.PAYLOAD_DATABASE === 'supabase') {
      // TODO: This test is flaky on supabase in CI, so we skip it for now
      return
    }
    const amount = 50
    payload.config.jobs.deleteJobOnComplete = false

    const job = await payload.jobs.queue({
      workflow: 'parallelTask',
      input: {
        amount,
      },
    })

    await payload.jobs.run({ silent: true })

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    // error can be defined while hasError is true, as hasError: true is only set if the job cannot retry anymore.
    expect(Boolean(jobAfterRun.error)).toBe(false)
    expect(jobAfterRun.hasError).toBe(false)
    expect(jobAfterRun.log?.length).toBe(amount)

    const simpleDocs = await payload.find({
      collection: 'simple',
      limit: amount,
      depth: 0,
    })
    expect(simpleDocs.docs).toHaveLength(amount)

    // Ensure all docs are created (= all tasks are run once)
    for (let i = 1; i <= simpleDocs.docs.length; i++) {
      const simpleDoc = simpleDocs.docs.find((doc) => doc.title === `parallel task ${i}`)
      const logEntry = jobAfterRun?.log?.find((log) => log.taskID === `parallel task ${i}`)
      expect(simpleDoc).toBeDefined()
      expect(logEntry).toBeDefined()
      expect((logEntry?.output as any)?.simpleID).toBe(simpleDoc?.id)
    }
  })

  it('can reliably run workflows with parallel tasks that complete immediately', async () => {
    const amount = 20
    payload.config.jobs.deleteJobOnComplete = false

    const job = await payload.jobs.queue({
      workflow: 'fastParallelTask',
      input: {
        amount,
      },
    })

    await payload.jobs.run({ silent: false })

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    // error can be defined while hasError is true, as hasError: true is only set if the job cannot retry anymore.
    expect(Boolean(jobAfterRun.error)).toBe(false)
    expect(jobAfterRun.hasError).toBe(false)
    expect(jobAfterRun.log?.length).toBe(amount)
  })

  it('can create and autorun jobs', async () => {
    await payload.jobs.queue({
      workflow: 'inlineTaskTest',
      queue: 'autorunSecond',
      input: {
        message: 'hello!',
      },
    })

    await waitUntilAutorunIsDone({
      payload,
      queue: 'autorunSecond',
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples?.docs?.[0]?.title).toBe('hello!')
  })
})
