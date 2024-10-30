import type { RichTextGenerateClientProps } from 'payload'

import { getFromImportMap } from '@payloadcms/ui/elements/RenderServerComponent'

import type { FeatureProviderProviderClient } from '../features/typesClient.js'
import type { ResolvedServerFeatureMap } from '../features/typesServer.js'
import type { LexicalRichTextFieldProps } from '../types.js'

export const getGenerateClientProps =
  (args: { resolvedFeatureMap: ResolvedServerFeatureMap }): RichTextGenerateClientProps =>
  ({ clientField, field, i18n, importMap, payload, schemaPath }) => {
    const clientProps: {
      clientFeatures: LexicalRichTextFieldProps['clientFeatures']
    } = {
      clientFeatures: {},
    }

    // turn args.resolvedFeatureMap into an array of [key, value] pairs, ordered by value.order, lowest order first:
    const resolvedFeatureMapArray = Array.from(args.resolvedFeatureMap.entries()).sort(
      (a, b) => a[1].order - b[1].order,
    )

    for (const [featureKey, resolvedFeature] of resolvedFeatureMapArray) {
      /**
       * Handle Feature Component Maps

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

          // @ts-expect-error - TODO: fix this
          const mappedComponent: MappedComponent = createMappedComponent(
            payloadComponent,
            {
              clientProps: {
                componentKey,
                featureKey: resolvedFeature.key,
                key: `${resolvedFeature.key}-${componentKey}`,
              },
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
      } */

      const ClientFeaturePayloadComponent = resolvedFeature.ClientFeature

      if (ClientFeaturePayloadComponent) {
        const clientFeatureProvider = getFromImportMap<FeatureProviderProviderClient>({
          importMap,
          PayloadComponent: ClientFeaturePayloadComponent,
          schemaPath: 'lexical-clientComponent',
          silent: true,
        })

        if (!clientFeatureProvider) {
          continue
        }

        const clientFeatureProps = resolvedFeature.clientFeatureProps ?? {}
        clientFeatureProps.featureKey = resolvedFeature.key
        clientFeatureProps.order = resolvedFeature.order
        if (
          typeof ClientFeaturePayloadComponent === 'object' &&
          ClientFeaturePayloadComponent.clientProps
        ) {
          clientFeatureProps.clientProps = ClientFeaturePayloadComponent.clientProps
        }

        // As clientFeatureProvider is a client function, we cannot execute it on the server here. Thus, the client will have to execute clientFeatureProvider with its props
        clientProps.clientFeatures[featureKey] = { clientFeatureProps, clientFeatureProvider }
      }
    }

    return clientProps
  }
