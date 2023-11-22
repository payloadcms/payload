import { GraphQLClient } from 'graphql-request'

import type { TypeWithID } from '../../packages/payload/src/collections/config/types'
import type { PayloadRequest } from '../../packages/payload/src/express/types'

import payload from '../../packages/payload/src'
import { commitTransaction } from '../../packages/payload/src/utilities/commitTransaction'
import { initTransaction } from '../../packages/payload/src/utilities/initTransaction'
import { devUser } from '../credentials'
import { initPayloadTest } from '../helpers/configHelpers'

describe('database', () => {
  let serverURL
  let client: GraphQLClient
  let token: string
  const collection = 'posts'
  const title = 'title'
  let user: TypeWithID & Record<string, unknown>
  let useTransactions = true

  beforeAll(async () => {
    const init = await initPayloadTest({ __dirname, init: { local: false } })
    serverURL = init.serverURL
    const url = `${serverURL}/api/graphql`
    client = new GraphQLClient(url)
    if (payload.db.name === 'mongoose') {
      useTransactions = false
    }

    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    if (loginResult.token) token = loginResult.token
    user = loginResult.user
  })

  describe('transactions', () => {
    describe('local api', () => {
      it('should commit multiple operations in isolation', async () => {
        const req = {
          payload,
          user,
        } as PayloadRequest

        await initTransaction(req)

        const first = await payload.create({
          collection,
          data: {
            title,
          },
          req,
        })

        if (useTransactions) {
          await expect(() =>
            payload.findByID({
              id: first.id,
              collection,
              // omitting req for isolation
            }),
          ).rejects.toThrow('The requested resource was not found.')
        }

        const second = await payload.create({
          collection,
          data: {
            title,
          },
          req,
        })

        await commitTransaction(req)
        expect(req.transactionID).toBeUndefined()

        const firstResult = await payload.findByID({
          id: first.id,
          collection,
          req,
        })
        const secondResult = await payload.findByID({
          id: second.id,
          collection,
          req,
        })

        expect(firstResult.id).toStrictEqual(first.id)
        expect(secondResult.id).toStrictEqual(second.id)
      })

      it('should commit multiple operations async', async () => {
        const req = {
          payload,
          user,
        } as PayloadRequest

        let first
        let second

        const firstReq = payload
          .create({
            collection,
            data: {
              title,
            },
            req,
          })
          .then((res) => {
            first = res
          })

        const secondReq = payload
          .create({
            collection,
            data: {
              title,
            },
            req,
          })
          .then((res) => {
            second = res
          })

        await Promise.all([firstReq, secondReq])

        await commitTransaction(req)
        expect(req.transactionID).toBeUndefined()

        const firstResult = await payload.findByID({
          id: first.id,
          collection,
          req,
        })
        const secondResult = await payload.findByID({
          id: second.id,
          collection,
          req,
        })

        expect(firstResult.id).toStrictEqual(first.id)
        expect(secondResult.id).toStrictEqual(second.id)
      })

      it('should rollback operations on failure', async () => {
        const req = {
          payload,
          user,
        } as PayloadRequest

        await initTransaction(req)

        const first = await payload.create({
          collection,
          data: {
            title,
          },
          req,
        })
        const promises = [
          payload.create({
            collection,
            data: {
              throwAfterChange: true,
              title,
            },
            req,
          }),
          // multiple documents should be able to fail without error
          payload.create({
            collection,
            data: {
              throwAfterChange: true,
              title,
            },
            req,
          }),
        ]

        try {
          await Promise.all(promises)
        } catch (e) {
          // catch errors and carry on
        }

        expect(req.transactionID).toBeFalsy()

        // this should not do anything but is needed to be certain about the next assertion
        await commitTransaction(req)

        if (useTransactions) {
          await expect(() =>
            payload.findByID({
              id: first.id,
              collection,
              req,
            }),
          ).rejects.toThrow('The requested resource was not found.')
        }
      })
    })
  })
})
