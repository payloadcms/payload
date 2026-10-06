import { GraphQLInputObjectType, GraphQLList, GraphQLString, parseValue } from 'graphql'
import { describe, expect, it } from 'vitest'

import { buildLocalizedMutationInputType } from './buildLocalizedMutationInputType.js'
import { buildLocalizedOutputType } from './buildLocalizedOutputType.js'

const localeCodes = ['en', 'fr']

// These scalars retain the underlying field type's coercion for each locale.
describe('localized GraphQL field types', () => {
  it('should parse ordinary strings and localized strings from variables and literals', () => {
    const type = buildLocalizedMutationInputType({
      localeCodes,
      name: 'LocalizedStringInput',
      type: GraphQLString,
    })

    expect('parseValue' in type && type.parseValue('Hello')).toBe('Hello')
    expect('parseValue' in type && type.parseValue({ en: 'Hello', fr: 'Bonjour' })).toEqual({
      en: 'Hello',
      fr: 'Bonjour',
    })
    expect(
      'parseLiteral' in type && type.parseLiteral(parseValue('{ en: "Hello", fr: "Bonjour" }'), {}),
    ).toEqual({ en: 'Hello', fr: 'Bonjour' })
  })

  it('should reject locale values that do not match the original field type', () => {
    const type = buildLocalizedMutationInputType({
      localeCodes,
      name: 'StrictLocalizedStringInput',
      type: GraphQLString,
    })

    expect(() => 'parseValue' in type && type.parseValue({ en: 123 })).toThrow()
    expect(
      () => 'parseLiteral' in type && type.parseLiteral(parseValue('{ en: 123 }'), {}),
    ).toThrow()
    expect(() => 'parseValue' in type && type.parseValue({ unknown: 'Hello' })).toThrow()
  })

  it('should preserve structured input coercion for localized arrays', () => {
    const row = new GraphQLInputObjectType({
      name: 'LocalizedTestRow',
      fields: { label: { type: GraphQLString } },
    })
    const type = buildLocalizedMutationInputType({
      localeCodes,
      name: 'LocalizedRowsInput',
      type: new GraphQLList(row),
    })
    const value = { en: [{ label: 'English' }], fr: [{ label: 'French' }] }

    expect('parseValue' in type && type.parseValue(value)).toEqual(value)
    expect(
      'parseLiteral' in type &&
        type.parseLiteral(
          parseValue('{ en: [{ label: "English" }], fr: [{ label: "French" }] }'),
          {},
        ),
    ).toEqual(value)
    expect(
      () => 'parseValue' in type && type.parseValue({ en: [{ unknown: 'Invalid' }] }),
    ).toThrow()
  })

  it('should serialize scalar and list locale maps while retaining normal values', () => {
    const scalar = buildLocalizedOutputType({
      localeCodes,
      name: 'LocalizedStringOutput',
      type: GraphQLString,
    })
    const list = buildLocalizedOutputType({
      localeCodes,
      name: 'LocalizedStringsOutput',
      type: new GraphQLList(GraphQLString),
    })

    expect('serialize' in scalar && scalar.serialize('Hello')).toBe('Hello')
    expect('serialize' in scalar && scalar.serialize({ en: 'Hello', fr: null })).toEqual({
      en: 'Hello',
      fr: null,
    })
    expect('serialize' in list && list.serialize({ en: ['Hello'], fr: ['Bonjour'] })).toEqual({
      en: ['Hello'],
      fr: ['Bonjour'],
    })
    expect(() => 'serialize' in scalar && scalar.serialize({ en: {} })).toThrow()
  })
})
