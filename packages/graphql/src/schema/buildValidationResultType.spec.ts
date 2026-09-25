import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql'
import { describe, expect, it } from 'vitest'

import { buildValidationResultType } from './buildValidationResultType.js'

describe('buildValidationResultType', () => {
  it('should not conflict with a user GraphQL type named ValidationResult', () => {
    const userValidationResultType = new GraphQLObjectType({
      name: 'ValidationResult',
      fields: {
        id: { type: GraphQLString },
      },
    })
    const payloadValidationResultType = buildValidationResultType()

    const schema = new GraphQLSchema({
      mutation: new GraphQLObjectType({
        name: 'Mutation',
        fields: {
          validatePost: { type: payloadValidationResultType },
        },
      }),
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          validationResult: { type: userValidationResultType },
        },
      }),
    })

    expect(schema.getType('ValidationResult')).toBe(userValidationResultType)
    expect(schema.getType('PayloadValidationResult')).toBe(payloadValidationResultType)
    expect(schema.getType('PayloadValidationFieldError')).toBeDefined()
  })

  it('should not conflict with a user GraphQL type named ValidationFieldError', () => {
    const userValidationFieldErrorType = new GraphQLObjectType({
      name: 'ValidationFieldError',
      fields: {
        id: { type: GraphQLString },
      },
    })
    const payloadValidationResultType = buildValidationResultType()

    const schema = new GraphQLSchema({
      mutation: new GraphQLObjectType({
        name: 'Mutation',
        fields: {
          validatePost: { type: payloadValidationResultType },
        },
      }),
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          validationFieldError: { type: userValidationFieldErrorType },
        },
      }),
    })

    expect(schema.getType('ValidationFieldError')).toBe(userValidationFieldErrorType)
    expect(schema.getType('PayloadValidationResult')).toBe(payloadValidationResultType)
    expect(schema.getType('PayloadValidationFieldError')).toBeDefined()
  })
})
