import type { CollectionConfig, GlobalConfig, SanitizedConfig } from 'payload'

import { getNamedType, type GraphQLObjectType, type GraphQLOutputType } from 'graphql'
import { describe, expect, it } from 'vitest'

import { buildPoliciesType, buildPolicyType } from './buildPoliciesType.js'

const collection = {
  fields: [{ name: 'title', type: 'text' }],
  slug: 'posts',
} as CollectionConfig

const globalConfig = {
  fields: [{ name: 'title', type: 'text' }],
  slug: 'settings',
} as GlobalConfig

function getObjectType(type: GraphQLOutputType): GraphQLObjectType {
  return getNamedType(type) as GraphQLObjectType
}

function expectValidatePermissions(type: GraphQLObjectType): void {
  expect(type.getFields().validate).toBeDefined()

  const fieldsType = getObjectType(type.getFields().fields!.type)
  const titleType = getObjectType(fieldsType.getFields().title!.type)

  expect(titleType.getFields().validate).toBeDefined()
}

describe('buildPoliciesType', () => {
  it('should expose collection, global, and field validation permissions through Access', () => {
    const accessType = buildPoliciesType({
      collections: [collection],
      globals: [globalConfig],
    } as SanitizedConfig)

    expectValidatePermissions(getObjectType(accessType.getFields().posts!.type))
    expectValidatePermissions(getObjectType(accessType.getFields().settings!.type))
  })

  it('should expose collection, global, and field validation permissions through docAccess', () => {
    const collectionDocAccessType = buildPolicyType({
      entity: collection,
      scope: 'docAccess',
      type: 'collection',
      typeSuffix: 'DocAccess',
    })
    const globalDocAccessType = buildPolicyType({
      entity: globalConfig,
      scope: 'docAccess',
      type: 'global',
      typeSuffix: 'DocAccess',
    })

    expectValidatePermissions(collectionDocAccessType)
    expectValidatePermissions(globalDocAccessType)
  })
})
