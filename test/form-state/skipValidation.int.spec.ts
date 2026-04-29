import type { Payload, User } from 'payload'

import { buildFormState } from '@payloadcms/ui/utilities/buildFormState'
import path from 'path'
import { createLocalReq } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import { postsSlug } from './collections/Posts/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let restClient: NextRESTClient
let user: User

const { email, password } = devUser

describe('Phase 4.6 / 5.4d — skipValidation gates custom validate', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname, undefined, true))

    const data = await restClient
      .POST('/users/login', {
        body: JSON.stringify({
          email,
          password,
        }),
      })
      .then((res) => res.json())

    user = data.user
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('skips custom validate when buildFormState is called with skipValidation: true', async () => {
    const req = await createLocalReq({ user }, payload)

    const { state } = await buildFormState({
      mockRSCs: true,
      collectionSlug: postsSlug,
      data: { serverValidatedField: 'Not allowed' },
      docPermissions: {
        create: true,
        delete: true,
        fields: true,
        read: true,
        readVersions: true,
        update: true,
      },
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
      operation: 'update',
      renderAllFields: false,
      req,
      schemaPath: postsSlug,
      skipValidation: true,
    })

    expect(state.serverValidatedField).toBeDefined()
    expect(state.serverValidatedField?.errorMessage).toBeFalsy()
    expect(state.serverValidatedField?.valid).not.toBe(false)
  })

  it('still invokes custom validate when skipValidation is false', async () => {
    const req = await createLocalReq({ user }, payload)

    const { state } = await buildFormState({
      mockRSCs: true,
      collectionSlug: postsSlug,
      data: { serverValidatedField: 'Not allowed' },
      docPermissions: {
        create: true,
        delete: true,
        fields: true,
        read: true,
        readVersions: true,
        update: true,
      },
      docPreferences: {
        fields: {},
      },
      documentFormState: undefined,
      operation: 'update',
      renderAllFields: false,
      req,
      schemaPath: postsSlug,
      skipValidation: false,
    })

    expect(state.serverValidatedField).toBeDefined()
    expect(state.serverValidatedField?.errorMessage).toBe('serverValidatedField rejected the value')
    expect(state.serverValidatedField?.valid).toBe(false)
  })
})
