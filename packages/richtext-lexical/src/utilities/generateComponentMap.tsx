import type { ClientField, MappedComponent, RichTextGenerateComponentMap } from 'payload'

import { getComponent } from '@payloadcms/ui/shared'
import { createClientFields } from '@payloadcms/ui/utilities/createClientConfig'
import { deepCopyObjectSimple } from 'payload'

import type { ResolvedServerFeatureMap } from '../features/typesServer.js'
import type { GeneratedFeatureProviderComponent } from '../types.js'

export const getGenerateComponentMap =
  (args: { resolvedFeatureMap: ResolvedServerFeatureMap }): RichTextGenerateComponentMap =>
  ({ createMappedComponent, field, i18n, importMap, payload, schemaPath }) => {
    const componentMap: Map<
      string,
      ClientField[] | GeneratedFeatureProviderComponent[] | MappedComponent
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
                    i18n,
                    payload,
                    props: resolvedFeature.sanitizedServerFeatureProps,
                    schemaPath,
                  })
                : resolvedFeature.componentMap

            for (const componentKey in components) {
              const payloadComponent = components[componentKey]

              const mappedComponent: MappedComponent = createMappedComponent(
                payloadComponent,
                {
                  componentKey,
                  featureKey: resolvedFeature.key,
                  key: `${resolvedFeature.key}-${componentKey}`,
                },
                undefined,
                'lexical-from-resolvedFeature',
              )

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
              config: payload.config,
              field,
              i18n,
              props: resolvedFeature.sanitizedServerFeatureProps,
              schemaMap: new Map(),
              schemaPath,
            })

            if (schemas) {
              for (const [schemaKey, fields] of schemas.entries()) {
                let clientFields: ClientField[] = deepCopyObjectSimple(
                  fields,
                ) as unknown as ClientField[]
                clientFields = createClientFields({
                  clientFields,
                  createMappedComponent,
                  disableAddingID: true,
                  fields,
                  i18n,
                  importMap,
                  parentPath: `${schemaPath}.lexical_internal_feature.${featureKey}.fields.${schemaKey}`,
                  payload,
                })

                componentMap.set(
                  `lexical_internal_feature.${featureKey}.fields.${schemaKey}`,
                  clientFields,
                )
              }
            }
          }

          const ClientComponent = resolvedFeature.ClientFeature
          const ResolvedClientComponent = getComponent({
            identifier: 'lexical-clientComponent',
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
