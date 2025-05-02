import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

let restClient: NextRESTClient
let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Custom GraphQL', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  if (!['sqlite', 'sqlite-uuid'].includes(process.env.PAYLOAD_DATABASE || '')) {
    describe('Isolated Transaction ID', () => {
      it('should isolate transaction IDs between queries in the same request', async () => {
        const query = `query {
          TransactionID1
          TransactionID2
      }`
        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
          })
          .then((res) => res.json())
        // either no transactions at all or they are different
        expect(
          (data.TransactionID2 === null && data.TransactionID1 === null) ||
            data.TransactionID2 !== data.TransactionID1,
        ).toBe(true)
      })
      it('should isolate transaction IDs between mutations in the same request', async () => {
        const query = `mutation {
          MutateTransactionID1
          MutateTransactionID2
      }`
        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
          })
          .then((res) => res.json())
        // either no transactions at all or they are different
        expect(
          (data.MutateTransactionID2 === null && data.MutateTransactionID1 === null) ||
            data.MutateTransactionID2 !== data.MutateTransactionID1,
        ).toBe(true)
      })
    })
  } else {
    it('should not run isolated transaction ID tests for sqlite', () => {
      expect(true).toBe(true)
    })
  }
})
