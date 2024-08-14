import { GraphQLJSON } from '@payloadcms/graphql/types'
import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { commitTransaction, initTransaction, killTransaction } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

const resolveTransactionId = async (_obj, _args, context) => {
  try {
    const shouldCommit = await initTransaction(context.req)
    const transactionID = context.req.transactionID
    if (shouldCommit) {
      await commitTransaction(context.req)
    }
    return transactionID ? String(transactionID) : null
  } catch (e) {
    await killTransaction(context.req)
    throw e
  }
}

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [],
  globals: [],
  graphQL: {
    mutations: (GraphQL) => {
      return {
        MutateTransactionID1: {
          type: GraphQL.GraphQLString,
          resolve: resolveTransactionId,
        },
        MutateTransactionID2: {
          type: GraphQL.GraphQLString,
          resolve: resolveTransactionId,
        },
      }
    },
    queries: (GraphQL) => {
      return {
        TransactionID1: {
          type: GraphQL.GraphQLString,
          resolve: resolveTransactionId,
        },
        TransactionID2: {
          type: GraphQL.GraphQLString,
          resolve: resolveTransactionId,
        },
        foo: {
          type: GraphQLJSON,
          args: {},
          resolve: () => 'json test',
        },
      }
    },
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
