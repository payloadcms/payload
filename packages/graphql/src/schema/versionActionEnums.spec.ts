import { GraphQLError, GraphQLObjectType, GraphQLSchema, GraphQLString, Kind } from 'graphql'
import { describe, expect, it } from 'vitest'

import {
  GraphQLCreateAction,
  GraphQLReadVersion,
  GraphQLRestoreAction,
  GraphQLUpdateAction,
} from './versionActionEnums'

describe('versionActionEnums', () => {
  it('should expose stable GraphQL names and public lower-case/camel-case values', () => {
    expect(GraphQLReadVersion.name).toBe('ReadVersion')
    expect(GraphQLReadVersion.getValues().map((value) => value.name)).toEqual([
      'published',
      'latest',
      'draft',
    ])
    expect(GraphQLReadVersion.getValues().map((value) => value.value)).toEqual([
      'published',
      'latest',
      'draft',
    ])

    expect(GraphQLCreateAction.name).toBe('CreateAction')
    expect(GraphQLCreateAction.getValues().map((value) => value.value)).toEqual([
      'publish',
      'saveDraft',
    ])

    expect(GraphQLUpdateAction.name).toBe('UpdateAction')
    expect(GraphQLUpdateAction.getValues().map((value) => value.value)).toEqual([
      'publish',
      'saveDraft',
      'unpublish',
    ])

    expect(GraphQLRestoreAction.name).toBe('RestoreAction')
    expect(GraphQLRestoreAction.getValues().map((value) => value.value)).toEqual([
      'publish',
      'saveDraft',
    ])
  })

  it('should reject Boolean and unknown values', () => {
    expect(() => GraphQLReadVersion.parseValue(true)).toThrow(GraphQLError)
    expect(() => GraphQLReadVersion.parseValue(false)).toThrow(GraphQLError)
    expect(() => GraphQLCreateAction.parseValue(true)).toThrow(GraphQLError)
    expect(() => GraphQLUpdateAction.parseValue(false)).toThrow(GraphQLError)
    expect(() => GraphQLReadVersion.parseValue('Latest')).toThrow(GraphQLError)
    expect(() => GraphQLCreateAction.parseValue('unpublish')).toThrow(GraphQLError)

    expect(() => GraphQLReadVersion.parseLiteral({ kind: Kind.BOOLEAN, value: true }, {})).toThrow(
      GraphQLError,
    )
    expect(() =>
      GraphQLUpdateAction.parseLiteral({ kind: Kind.BOOLEAN, value: false }, {}),
    ).toThrow(GraphQLError)
  })

  it('should reuse the same enum objects across a schema', () => {
    const Query = new GraphQLObjectType({
      name: 'Query',
      fields: {
        first: {
          type: GraphQLString,
          args: { version: { type: GraphQLReadVersion } },
        },
        second: {
          type: GraphQLString,
          args: { version: { type: GraphQLReadVersion } },
        },
      },
    })

    const Mutation = new GraphQLObjectType({
      name: 'Mutation',
      fields: {
        create: {
          type: GraphQLString,
          args: { action: { type: GraphQLCreateAction } },
        },
        update: {
          type: GraphQLString,
          args: { action: { type: GraphQLUpdateAction } },
        },
        restore: {
          type: GraphQLString,
          args: { action: { type: GraphQLRestoreAction } },
        },
      },
    })

    expect(() => new GraphQLSchema({ query: Query, mutation: Mutation })).not.toThrow()
  })
})
