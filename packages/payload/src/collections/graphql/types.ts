import type { GraphQLType } from 'graphql'

export type BaseFields = {
  createdAt?: { type: GraphQLType }
  id?: { type: GraphQLType }
  updatedAt?: { type: GraphQLType }
}
