import { commitTransaction } from '../../packages/payload/src/utilities/commitTransaction'
import { initTransaction } from '../../packages/payload/src/utilities/initTransaction'
import { killTransaction } from '../../packages/payload/src/utilities/killTransaction'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

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
  collections: [],
  globals: [],
  graphQL: {
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
      }
    },
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
})
