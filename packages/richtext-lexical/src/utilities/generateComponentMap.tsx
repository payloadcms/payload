import type { MappedComponent, MappedField, RichTextGenerateComponentMap } from 'payload'

import { getComponent } from '@payloadcms/ui/shared'

import type { ResolvedServerFeatureMap } from '../features/typesServer.js'
import type { GeneratedFeatureProviderComponent } from '../types.js'
import { createClientFieldConfigs } from 'packages/ui/src/providers/Config/createClientConfig/fields.js'

export const getGenerateComponentMap =
  (args: { resolvedFeatureMap: ResolvedServerFeatureMap }): RichTextGenerateComponentMap =>
  ({ config, createMappedComponent, field, i18n, importMap, schemaPath }) => {
    const componentMap: Map<
      string,
      GeneratedFeatureProviderComponent[] | MappedComponent | MappedField[]
    > = new Map()

    // turn args.resolvedFeatureMap into an array of [key, value] pairs, ordered by value.order, lowest order first:
    const resolvedFeatureMapArray = Array.from(args.resolvedFeatureMap.entries()).sort(
      (a, b) => a[1].order - b[1].order,
    )

    componentMap.set(
      `features`,
      resolvedFeatureMapArray
        .map(([featureKey, resolvedFeature]) => {
          /**
           * Handle Feature Component Maps
           */
          if ('componentMap' in resolvedFeature) {
            const components =
              typeof resolvedFeature.componentMap === 'function'
                ? resolvedFeature.componentMap({
                    config,
                    i18n,
                    props: resolvedFeature.sanitizedServerFeatureProps,
                    schemaPath,
                  })
                : resolvedFeature.componentMap

            for (const componentKey in components) {
              const payloadComponent = components[componentKey]

              const mappedComponent: MappedComponent = createMappedComponent(payloadComponent, {
                componentKey,
                featureKey: resolvedFeature.key,
                key: `${resolvedFeature.key}-${componentKey}`,
              })

              if (mappedComponent) {
                componentMap.set(
                  `lexical_internal_feature.${featureKey}.lexical_internal_components.${componentKey}`,
                  mappedComponent,
                )
              }
            }
          }

          /**
           * Handle Feature Schema Maps (rendered fields)
           */
          if (
            'generateSchemaMap' in resolvedFeature &&
            typeof resolvedFeature.generateSchemaMap === 'function'
          ) {
            const schemas = resolvedFeature.generateSchemaMap({
              config,
              field,
              i18n,
              props: resolvedFeature.sanitizedServerFeatureProps,
              schemaMap: new Map(),
              schemaPath,
            })

            if (schemas) {
              for (const [schemaKey, fields] of schemas.entries()) {
                const fields = createClientFieldConfigs({
                  config,
                  createMappedComponent,
                  disableAddingID: true,
                  fieldSchema: fields,
                  i18n,
                  importMap,
                  parentPath: `${schemaPath}.lexical_internal_feature.${featureKey}.fields.${schemaKey}`,
                  readOnly: false,
                })

                componentMap.set(
                  `lexical_internal_feature.${featureKey}.fields.${schemaKey}`,
                  fields,
                )
              }
            }
          }

          const ClientComponent = resolvedFeature.ClientFeature
          const ResolvedClientComponent = getComponent({
            importMap,
            payloadComponent: ClientComponent,
          })
          const clientComponentProps = resolvedFeature.clientFeatureProps

          if (!ClientComponent) {
            return null
          }

          return {
            ClientFeature:
              clientComponentProps && typeof clientComponentProps === 'object' ? (
                <ResolvedClientComponent.Component
                  {...clientComponentProps}
                  featureKey={resolvedFeature.key}
                  key={resolvedFeature.key}
                  order={resolvedFeature.order}
                  {...(ResolvedClientComponent?.clientProps || {})}
                />
              ) : (
                <ResolvedClientComponent.Component
                  featureKey={resolvedFeature.key}
                  key={resolvedFeature.key}
                  order={resolvedFeature.order}
                  {...(ResolvedClientComponent?.clientProps || {})}
                />
              ),
            key: resolvedFeature.key,
            order: resolvedFeature.order,
          } as GeneratedFeatureProviderComponent
        })
        .filter((feature) => feature !== null),
    )

    return componentMap
  }
