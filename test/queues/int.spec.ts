import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload
let restClient: NextRESTClient
let token: string

const { email, password } = devUser
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Queues', () => {
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload, restClient } = initialized)

    const data = await restClient
      .POST('/users/login', {
        body: JSON.stringify({
          email,
          password,
        }),
      })
      .then((res) => res.json())

    token = data.token
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
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
    expect(postAfterJobs.jobStep2Ran).toStrictEqual('goodbye')
  })
})
