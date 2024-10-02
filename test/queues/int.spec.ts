import type { Payload } from 'payload'

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
    expect(jobAfterRun.input.amountRetried).toBe(2)
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

  it('can queue single tasks multiple times', async () => {
    for (let i = 0; i < 10; i++) {
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

    expect(allSimples.totalDocs).toBe(10)
    expect(allSimples.docs[0].title).toBe('from single task')
    expect(allSimples.docs[9].title).toBe('from single task')
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
})
