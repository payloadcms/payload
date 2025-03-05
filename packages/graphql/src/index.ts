import type { OperationArgs } from 'graphql-http'
import type { Field, GraphQLInfo, SanitizedConfig } from 'payload'

import * as GraphQL from 'graphql'

import {
  createComplexityRule,
  fieldExtensionsEstimator,
  simpleEstimator,
} from './packages/graphql-query-complexity/index.js'
import { accessResolver } from './resolvers/auth/access.js'
import { buildFallbackLocaleInputType } from './schema/buildFallbackLocaleInputType.js'
import { buildLocaleInputType } from './schema/buildLocaleInputType.js'
import { buildPoliciesType } from './schema/buildPoliciesType.js'
import { initCollections } from './schema/initCollections.js'
import { initGlobals } from './schema/initGlobals.js'
import { formatName } from './utilities/formatName.js'
import { wrapCustomFields } from './utilities/wrapCustomResolver.js'

export const sanitizeFieldNames = (fields: Field[]): Field[] => {
  return fields.map((field) => {
    if ('name' in field) {
      field.name = formatName(field.name)
    }

    if (
      field.type === 'row' ||
      field.type === 'array' ||
      field.type === 'collapsible' ||
      field.type === 'group'
    ) {
      field.fields = sanitizeFieldNames(field.fields)
    }

    if (field.type === 'blocks') {
      field.blocks.forEach((block) => {
        block.fields = sanitizeFieldNames(block.fields)
      })
    }

    if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        if ('name' in tab) {
          tab.name = formatName(tab.name)
        }
        tab.fields = sanitizeFieldNames(tab.fields)
      })
    }

    return field
  })
}

export function configToSchema(config: SanitizedConfig): {
  schema: GraphQL.GraphQLSchema
  validationRules: (args: OperationArgs<any>) => GraphQL.ValidationRule[]
} {
  config.collections = (config.collections || []).map((collection) => {
    collection.fields = sanitizeFieldNames(collection.fields)

    return collection
  })

  config.globals = (config.globals || []).map((global) => {
    global.fields = sanitizeFieldNames(global.fields)

    return global
  })

  const collections = config.collections.reduce((acc, collection) => {
    acc[collection.slug] = {
      config: collection,
    }

    return acc
  }, {})

  const globals = {
    config: config.globals,
  }

  const graphqlResult: GraphQLInfo = {
    collections,
    globals,
    Mutation: {
      name: 'Mutation',
      fields: {},
    },
    Query: {
      name: 'Query',
      fields: {},
    },
    types: {
      arrayTypes: {},
      blockInputTypes: {},
      blockTypes: {},
      groupTypes: {},
      tabTypes: {},
    },
  }

  if (config.localization) {
    graphqlResult.types['localeInputType'] = buildLocaleInputType(config.localization)
    graphqlResult.types['fallbackLocaleInputType'] = buildFallbackLocaleInputType(
      config.localization,
    )
  }

  initCollections({ config, graphqlResult })
  initGlobals({ config, graphqlResult })

  graphqlResult.Query.fields['Access'] = {
    type: buildPoliciesType(config),
    resolve: accessResolver(config),
  }

  if (typeof config.graphQL.queries === 'function') {
    const customQueries = config.graphQL.queries(GraphQL, {
      ...graphqlResult,
      config,
    })
    graphqlResult.Query = {
      ...graphqlResult.Query,
      fields: {
        ...graphqlResult.Query.fields,
        ...wrapCustomFields((customQueries || {}) as never),
      },
    }
  }

  if (typeof config.graphQL.mutations === 'function') {
    const customMutations = config.graphQL.mutations(GraphQL, {
      ...graphqlResult,
      config,
    })
    graphqlResult.Mutation = {
      ...graphqlResult.Mutation,
      fields: {
        ...graphqlResult.Mutation.fields,
        ...wrapCustomFields((customMutations || {}) as never),
      },
    }
  }

  const query = new GraphQL.GraphQLObjectType(graphqlResult.Query)
  const mutation = new GraphQL.GraphQLObjectType(graphqlResult.Mutation)

  const schema = new GraphQL.GraphQLSchema({
    mutation,
    query,
  })

  const validationRules = (args): GraphQL.ValidationRule[] => [
    createComplexityRule({
      estimators: [
        fieldExtensionsEstimator(),
        simpleEstimator({ defaultComplexity: 1 }), // Fallback if complexity not set
      ],
      maximumComplexity: config.graphQL.maxComplexity,
      variables: args.variableValues,
      // onComplete: (complexity) => { console.log('Query Complexity:', complexity); },
    }),
    ...(typeof config?.graphQL?.validationRules === 'function'
      ? config.graphQL.validationRules(args)
      : []),
  ]

  return {
    schema,
    validationRules,
  }
}
