import { GraphQLClient } from 'graphql-request'

import { initPayloadTest } from '../helpers/configHelpers'
import configPromise from './config'

let client: GraphQLClient

describe('Custom GraphQL', () => {
  beforeAll(async () => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } })
    const config = await configPromise
    const url = `${serverURL}${config.routes.api}${config.routes.graphQL}`
    client = new GraphQLClient(url)
  })

  describe('Isolated Transaction ID', () => {
    it('should isolate transaction IDs between queries in the same request', async () => {
      const query = `query {
          TransactionID1
          TransactionID2
      }`
      const response = await client.request(query)
      // either no transactions at all or they are different
      expect(
        (response.TransactionID2 === null && response.TransactionID1 === null) ||
          response.TransactionID2 !== response.TransactionID1,
      ).toBe(true)
    })
    it('should isolate transaction IDs between mutations in the same request', async () => {
      const query = `mutation {
          MutateTransactionID1
          MutateTransactionID2
      }`
      const response = await client.request(query)
      // either no transactions at all or they are different
      expect(
        (response.MutateTransactionID2 === null && response.MutateTransactionID1 === null) ||
          response.MutateTransactionID2 !== response.MutateTransactionID1,
      ).toBe(true)
    })
  })
})
