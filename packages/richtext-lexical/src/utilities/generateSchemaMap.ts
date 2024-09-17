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
        for (const [schemaKey, fields] of schemas.entries()) {
          // generate schema map entries for sub-fields using traverseFields
          traverseFields({
            config,
            fields,
            i18n,
            schemaMap: schemas,
            schemaPath: schemaKey,
          })

          schemaMap.set(`${schemaPath}.lexical_internal_feature.${featureKey}.${schemaKey}`, fields)
        }
      }
    }

    return schemaMap
  }
