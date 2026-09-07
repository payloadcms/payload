import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { describe, suite, test } from '../__helpers/int/vitest.js'

suite('Custom GraphQL', { config: './config.ts' }, () => {
  if (
    !['cosmosdb', 'firestore', 'sqlite', 'sqlite-uuid', 'sqlite-uuidv7'].includes(
      process.env.PAYLOAD_DATABASE || '',
    )
  ) {
    describe('Isolated Transaction ID', () => {
      test('should isolate transaction IDs between queries in the same request', async ({
        restClient,
      }) => {
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
      test('should isolate transaction IDs between mutations in the same request', async ({
        restClient,
      }) => {
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
    test('should not run isolated transaction ID tests for sqlite (incl. uuid variants)/firestore/cosmosdb', () => {
      expect(true).toBe(true)
    })
  }
})
