/* eslint-disable import/no-extraneous-dependencies */
import type { Response } from 'express'
import type { GraphQLFieldConfig } from 'graphql'
import type GraphQL from 'graphql'
import type { Payload } from 'payload'
import type { Config } from 'payload/config'
import type { PayloadRequest } from 'payload/dist/express/types'

import type { PasswordProtectionOptions } from '../types'
import operation from './operation'

interface Args {
  collection: string
  password: string
  id: string
}

type MutationType = GraphQLFieldConfig<void, { req: PayloadRequest; res: Response }, Args>

const getMutation = (
  GraphQLArg: typeof GraphQL,
  payload: Payload,
  config: Config,
  options: PasswordProtectionOptions,
): MutationType => {
  const { GraphQLBoolean, GraphQLString, GraphQLNonNull } = GraphQLArg

  return {
    type: GraphQLBoolean,
    args: {
      collection: {
        type: new GraphQLNonNull(GraphQLString),
      },
      password: {
        type: new GraphQLNonNull(GraphQLString),
      },
      id: {
        type: new GraphQLNonNull(GraphQLString),
      },
    },
    resolve: async (_, args, context) => {
      const { collection, password, id } = args

      try {
        await operation({
          config,
          payload,
          options,
          collection,
          password,
          id,
          res: context.res,
        })

        return true
      } catch {
        return false
      }
    },
  }
}

export default getMutation
