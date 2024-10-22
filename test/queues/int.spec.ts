import type { JobTaskStatus, Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { clearAndSeedEverything } from './seed.js'

let payload: Payload
let restClient: NextRESTClient
let token: string

const { email, password } = devUser
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Queues', () => {
  beforeAll(async () => {
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  beforeEach(async () => {
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
  })

  it('will run access control on jobs runner', async () => {
    const response = await restClient.GET('/payload-jobs/run', {
      headers: {
        // Authorization: `JWT ${token}`,
      },
    }) // Needs to be a rest call to test auth
    expect(response.status).toBe(401)
  })

  it('will return 200 from jobs runner', async () => {
    const response = await restClient.GET('/payload-jobs/run', {
      headers: {
        Authorization: `JWT ${token}`,
      },
    }) // Needs to be a rest call to test auth

    expect(response.status).toBe(200)
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

    await payload.jobs.run()

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

    await payload.jobs.run()

    const postAfterJobs = await payload.findByID({
      collection: 'posts',
      id: newPost.id,
    })

    expect(postAfterJobs.jobStep1Ran).toBe('hello')
    expect(postAfterJobs.jobStep2Ran).toBe('hellohellohellohello')
  })

  it('ensure job retrying works', async () => {
    const job = await payload.jobs.queue({
      workflow: 'retriesTest',
      input: {
        message: 'hello',
      },
    })

    let hasJobsRemaining = true

    while (hasJobsRemaining) {
      const response = await payload.jobs.run()

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
    const job = await payload.jobs.queue({
      workflow: 'retriesWorkflowLevelTest',
      input: {
        message: 'hello',
      },
    })

    let hasJobsRemaining = true

    while (hasJobsRemaining) {
      const response = await payload.jobs.run()

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

  /*
  // Task rollbacks are not supported in the current version of Payload. This test will be re-enabled when task rollbacks are supported once we figure out the transaction issues
  it('ensure failed tasks are rolled back via transactions', async () => {
    const job = await payload.jobs.queue({
      workflow: 'retriesRollbackTest',
      input: {
        message: 'hello',
      },
    })

    let hasJobsRemaining = true

    while (hasJobsRemaining) {
      const response = await payload.jobs.run()

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
  })*/

  it('ensure backoff strategy of task is respected', async () => {
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
      const response = await payload.jobs.run()

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
    expect((jobAfterRun.taskStatus as JobTaskStatus).inline['1'].totalTried).toBe(5)

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
        return new Date(arr[index + 1]).getTime() - new Date(time).getTime()
      })
      .filter((p) => p !== null)

    expect(durations).toHaveLength(4)
    expect(durations[0]).toBeGreaterThan(300)
    expect(durations[1]).toBeGreaterThan(600)
    expect(durations[2]).toBeGreaterThan(1200)
    expect(durations[3]).toBeGreaterThan(2400)
  })

  it('can create new inline jobs', async () => {
    await payload.jobs.queue({
      workflow: 'inlineTaskTest',
      input: {
        message: 'hello!',
      },
    })

    await payload.jobs.run()

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples.docs[0].title).toBe('hello!')
  })

  it('can queue single tasks', async () => {
    await payload.jobs.queue({
      task: 'CreateSimple',
      input: {
        message: 'from single task',
      },
    })

    await payload.jobs.run()

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples.docs[0].title).toBe('from single task')
  })

  /*
  // Task rollbacks are not supported in the current version of Payload. This test will be re-enabled when task rollbacks are supported once we figure out the transaction issues
  it('transaction test against payload-jobs collection', async () => {
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
  /*
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
  /*
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
  })*/

  it('can queue single tasks 8 times', async () => {
    for (let i = 0; i < 8; i++) {
      await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })
    }

    await payload.jobs.run()

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(8)
    expect(allSimples.docs[0].title).toBe('from single task')
    expect(allSimples.docs[7].title).toBe('from single task')
  })

  it('can queue single tasks 500 times', async () => {
    for (let i = 0; i < 500; i++) {
      await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })
    }

    await payload.jobs.run({
      limit: 1000,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 1000,
    })

    expect(allSimples.totalDocs).toBe(500) // Default limit: 10
    expect(allSimples.docs[0].title).toBe('from single task')
    expect(allSimples.docs[490].title).toBe('from single task')
  })

  it('ensure default jobs run limit of 10 works', async () => {
    for (let i = 0; i < 500; i++) {
      await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })
    }

    await payload.jobs.run()

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 1000,
    })

    expect(allSimples.totalDocs).toBe(10) // Default limit: 10
    expect(allSimples.docs[0].title).toBe('from single task')
    expect(allSimples.docs[9].title).toBe('from single task')
  })

  it('ensure jobs run limit can be customized', async () => {
    for (let i = 0; i < 500; i++) {
      await payload.jobs.queue({
        task: 'CreateSimple',
        input: {
          message: 'from single task',
        },
      })
    }

    await payload.jobs.run({
      limit: 42,
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 1000,
    })

    expect(allSimples.totalDocs).toBe(42) // Default limit: 10
    expect(allSimples.docs[0].title).toBe('from single task')
    expect(allSimples.docs[30].title).toBe('from single task')
    expect(allSimples.docs[41].title).toBe('from single task')
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

    await payload.jobs.run()

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

    await payload.jobs.run()

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples.docs[0].title).toBe('external')
  })

  it('can queue external workflow that is running external task', async () => {
    await payload.jobs.queue({
      workflow: 'externalWorkflow',
      input: {
        message: 'externalWorkflow',
      },
    })

    await payload.jobs.run()

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toBe(1)
    expect(allSimples.docs[0].title).toBe('externalWorkflow')
  })
})
