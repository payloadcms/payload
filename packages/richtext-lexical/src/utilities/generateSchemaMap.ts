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
      const load = () => {
        const schemas = resolvedFeature.generateSchemaMap!({
          config,
          field,
          i18n,
          props: resolvedFeature.sanitizedServerFeatureProps,
          schemaMap,
          schemaPath,
        })

        if (schemas) {
          for (const [schemaKey, field] of schemas.entries()) {
            if ('fields' in field) {
              // generate schema map entries for sub-fields using traverseFields
              traverseFields({
                config,
                fields: field.fields,
                i18n,
                parentIndexPath: '',
                parentSchemaPath: `${schemaPath}.lexical_internal_feature.${featureKey}.${schemaKey}`,
                schemaMap,
              })
            }

            schemaMap.set(
              `${schemaPath}.lexical_internal_feature.${featureKey}.${schemaKey}`,
              field,
            )
          }
        }
      }
      if (
        resolvedFeature.clientSchemaMapKeys &&
        'defer' in schemaMap &&
        typeof schemaMap.defer === 'function'
      ) {
        schemaMap.defer(`${schemaPath}.lexical_internal_feature.${featureKey}`, load)
      } else {
        load()
      }
    }

    return schemaMap
  }
