import type { RichTextAdapter } from 'payload'

import { mapFields } from '@payloadcms/ui/utilities/buildComponentMap'
import React from 'react'

import type { ResolvedServerFeatureMap } from './field/features/types.js'
import type { GeneratedFeatureProviderComponent } from './types.js'

export const getGenerateComponentMap =
  (args: {
    resolvedFeatureMap: ResolvedServerFeatureMap
  }): RichTextAdapter['generateComponentMap'] =>
  ({ WithServerSideProps, config, i18n, schemaPath }) => {
    const componentMap = new Map()

    // turn args.resolvedFeatureMap into an array of [key, value] pairs, ordered by value.order, lowest order first:
    const resolvedFeatureMapArray = Array.from(args.resolvedFeatureMap.entries()).sort(
      (a, b) => a[1].order - b[1].order,
    )

    componentMap.set(
      `features`,
      resolvedFeatureMapArray
        .map(([featureKey, resolvedFeature]) => {
          const ClientComponent = resolvedFeature.ClientComponent
          const clientComponentProps = resolvedFeature.clientFeatureProps

          /**
           * Handle Feature Component Maps
           */
          if (
            'generateComponentMap' in resolvedFeature &&
            typeof resolvedFeature.generateComponentMap === 'function'
          ) {
            const components = resolvedFeature.generateComponentMap({
              config,
              i18n,
              props: resolvedFeature.serverFeatureProps,
              schemaPath,
            })

            for (const componentKey in components) {
              const Component = components[componentKey]

              if (Component) {
                componentMap.set(
                  `feature.${featureKey}.components.${componentKey}`,
                  <WithServerSideProps
                    Component={Component}
                    componentKey={componentKey}
                    featureKey={resolvedFeature.key}
                    key={`${resolvedFeature.key}-${componentKey}`}
                  />,
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
              i18n,
              props: resolvedFeature.serverFeatureProps,
              schemaMap: new Map(),
              schemaPath,
            })

            if (schemas) {
              for (const [schemaKey, fields] of schemas.entries()) {
                const mappedFields = mapFields({
                  WithServerSideProps,
                  config,
                  disableAddingID: true,
                  fieldSchema: fields,
                  i18n,
                  parentPath: `${schemaPath}.feature.${featureKey}.fields.${schemaKey}`,
                  readOnly: false,
                })

                componentMap.set(`feature.${featureKey}.fields.${schemaKey}`, mappedFields)
              }
            }
          }

          if (!ClientComponent) {
            return null
          }

          return {
            ClientComponent:
              clientComponentProps && typeof clientComponentProps === 'object' ? (
                <ClientComponent
                  {...clientComponentProps}
                  featureKey={resolvedFeature.key}
                  key={resolvedFeature.key}
                  order={resolvedFeature.order}
                />
              ) : (
                <ClientComponent
                  featureKey={resolvedFeature.key}
                  key={resolvedFeature.key}
                  order={resolvedFeature.order}
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
