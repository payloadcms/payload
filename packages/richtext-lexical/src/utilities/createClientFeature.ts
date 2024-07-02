import type React from 'react'

import type {
  ClientComponentProps,
  ClientFeature,
  ClientFeatureProviderMap,
  FeatureProviderClient,
  FeatureProviderProviderClient,
  ResolvedClientFeatureMap,
} from '../features/typesClient.js'
import type { ClientEditorConfig } from '../lexical/config/types.js'

import { createClientComponent } from '../features/createClientComponent.js'

export type CreateClientFeatureArgs<UnSanitizedClientProps, ClientProps> =
  | ((props: {
      clientFunctions: Record<string, any>
      /** unSanitizedEditorConfig.features, but mapped */
      featureProviderMap: ClientFeatureProviderMap
      props: ClientComponentProps<UnSanitizedClientProps>
      // other resolved features, which have been loaded before this one. All features declared in 'dependencies' should be available here
      resolvedFeatures: ResolvedClientFeatureMap
      // unSanitized EditorConfig,
      unSanitizedEditorConfig: ClientEditorConfig
    }) => ClientFeature<ClientProps>)
  | Omit<ClientFeature<ClientProps>, 'sanitizedClientFeatureProps'>

export const createClientFeature: <
  UnSanitizedClientProps = undefined,
  ClientProps = UnSanitizedClientProps,
>(
  args: CreateClientFeatureArgs<UnSanitizedClientProps, ClientProps>,
) => React.FC<ClientComponentProps<ClientProps>> = (feature) => {
  const featureProviderProvideClient: FeatureProviderProviderClient<any, any> = (props) => {
    const featureProviderClient: Partial<FeatureProviderClient<any, any>> = {
      clientFeatureProps: props,
    }

    if (typeof feature === 'function') {
      featureProviderClient.feature = ({
        clientFunctions,
        featureProviderMap,
        resolvedFeatures,
        unSanitizedEditorConfig,
      }) => {
        const toReturn = feature({
          clientFunctions,
          featureProviderMap,
          props,
          resolvedFeatures,
          unSanitizedEditorConfig,
        })

        if (toReturn.sanitizedClientFeatureProps === null) {
          toReturn.sanitizedClientFeatureProps = props
        }

        return toReturn
      }
    } else {
      ;(feature as ClientFeature<any>).sanitizedClientFeatureProps = props
      featureProviderClient.feature = feature as ClientFeature<any>
    }
    return featureProviderClient as FeatureProviderClient<any, any>
  }

  return createClientComponent(featureProviderProvideClient)
}
