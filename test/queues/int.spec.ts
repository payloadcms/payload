import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { WorkflowretriesTestInput } from './payload-types.js'

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
    })

    expect(response.status).toStrictEqual(401)
  })

  it('will return 200 from jobs runner', async () => {
    const response = await restClient.GET('/payload-jobs/run', {
      headers: {
        Authorization: `JWT ${token}`,
      },
    })

    expect(response.status).toStrictEqual(200)
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

    await restClient.GET('/payload-jobs/run', {
      headers: {
        Authorization: `JWT ${token}`,
      },
    })

    const postAfterJobs = await payload.findByID({
      collection: 'posts',
      id: newPost.id,
    })

    expect(postAfterJobs.jobStep1Ran).toStrictEqual('hello')
    expect(postAfterJobs.jobStep2Ran).toStrictEqual('hellohellohellohello')
  })

  it('ensure job retrying works', async () => {
    const job = await payload.create({
      collection: 'payload-jobs',
      data: {
        // @ts-expect-error // TODO: Fix this type
        input: {
          message: 'hello',
        } as WorkflowretriesTestInput,
        workflowSlug: 'retriesTest',
      },
    })

    let hasJobsRemaining = true

    while (hasJobsRemaining) {
      const response = await restClient.GET('/payload-jobs/run', {
        headers: {
          Authorization: `JWT ${token}`,
        },
      })

      const responseJson = await response.json()
      console.log({ responseJson })
      if (responseJson.noJobsRemaining) {
        hasJobsRemaining = false
      }
    }

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toStrictEqual(1)

    const jobAfterRun = await payload.findByID({
      collection: 'payload-jobs',
      id: job.id,
    })

    // @ts-expect-error amountRetried is new arbitrary data and not in the type
    expect(jobAfterRun.input.amountRetried).toStrictEqual(2)
  })

  it('can create new inline jobs', async () => {
    const job = await payload.create({
      collection: 'payload-jobs',
      data: {
        // @ts-expect-error // TODO: Fix this type
        input: {
          message: 'hello!',
        } as WorkflowretriesTestInput,
        workflowSlug: 'inlineTaskTest',
      },
    })

    await restClient.GET('/payload-jobs/run', {
      headers: {
        Authorization: `JWT ${token}`,
      },
    })

    const allSimples = await payload.find({
      collection: 'simple',
      limit: 100,
    })

    expect(allSimples.totalDocs).toStrictEqual(1)
    expect(allSimples.docs[0].title).toStrictEqual('hello!')
  })
})
