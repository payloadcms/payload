import type { RichTextAdapter } from 'payload'

import { traverseFields } from '@payloadcms/ui/utilities/buildFieldSchemaMap/traverseFields'

import type { ResolvedServerFeatureMap } from '../features/typesServer.js'

export const getGenerateSchemaMap =
  (args: { resolvedFeatureMap: ResolvedServerFeatureMap }): RichTextAdapter['generateSchemaMap'] =>
  ({ config, field, i18n, schemaMap, schemaPath }) => {
    for (const [featureKey, resolvedFeature] of args.resolvedFeatureMap.entries()) {
      if (
        !('generateSchemaMap' in resolvedFeature) ||
        typeof resolvedFeature.generateSchemaMap !== 'function'
      ) {
        continue
      }
      const schemas = resolvedFeature.generateSchemaMap({
        config,
        field,
        i18n,
        props: resolvedFeature.sanitizedServerFeatureProps,
        schemaMap,
        schemaPath,
      })

      if (schemas) {
        const newSchemas = new Map()
        for (const schema of schemas) {
          newSchemas.set(schema[0], schema[1])
        }

        for (const [schemaKey, fields] of schemas.entries()) {
          // generate schema map entries for sub-fields using traverseFields
          if (Array.isArray(fields)) {
            traverseFields({
              config,
              fields,
              i18n,
              schemaMap: newSchemas,
              schemaPath: schemaKey ? schemaKey.split('.') : [],
            })

            schemaMap.set(
              `${schemaPath.join('.')}.lexical_internal_feature.${featureKey}.${schemaKey}`,
              fields,
            )
          } else {
            throw new Error(
              'Invalid schema map entry. Lexical feature schema map entries currently must be an array of fields.',
            )
          }
        }
      }
    }

    return schemaMap
  }
