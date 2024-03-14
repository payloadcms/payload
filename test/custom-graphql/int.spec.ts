import { getPayload } from '../../packages/payload/src/index.js'
import { NextRESTClient } from '../helpers/NextRESTClient.js'
import { startMemoryDB } from '../startMemoryDB.js'
import configPromise from './config.js'

let restClient: NextRESTClient

describe('Custom GraphQL', () => {
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    const payload = await getPayload({ config })
    restClient = new NextRESTClient(payload.config)
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

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
})
