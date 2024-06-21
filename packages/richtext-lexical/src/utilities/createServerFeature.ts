import type { SanitizedConfig } from 'payload'

import type {
  FeatureProviderProviderServer,
  FeatureProviderServer,
  ResolvedServerFeatureMap,
  ServerFeature,
  ServerFeatureProviderMap,
} from '../features/types.js'
import type { ServerEditorConfig } from '../lexical/config/types.js'

export type CreateServerFeatureArgs<UnSanitizedProps, SanitizedProps, ClientProps> = Pick<
  FeatureProviderServer<UnSanitizedProps, ClientProps>,
  'dependencies' | 'dependenciesPriority' | 'dependenciesSoft' | 'key'
> & {
  feature:
    | ((props: {
        config: SanitizedConfig
        /** unSanitizedEditorConfig.features, but mapped */
        featureProviderMap: ServerFeatureProviderMap
        isRoot?: boolean
        props: UnSanitizedProps
        // other resolved features, which have been loaded before this one. All features declared in 'dependencies' should be available here
        resolvedFeatures: ResolvedServerFeatureMap
        // unSanitized EditorConfig,
        unSanitizedEditorConfig: ServerEditorConfig
      }) =>
        | Promise<ServerFeature<SanitizedProps, ClientProps>>
        | ServerFeature<SanitizedProps, ClientProps>)
    | Omit<ServerFeature<SanitizedProps, ClientProps>, 'sanitizedServerFeatureProps'>
}

export const createServerFeature: <
  UnSanitizedProps = undefined,
  SanitizedProps = UnSanitizedProps,
  ClientProps = undefined,
>(
  args: CreateServerFeatureArgs<UnSanitizedProps, SanitizedProps, ClientProps>,
) => FeatureProviderProviderServer<UnSanitizedProps, SanitizedProps, ClientProps> = ({
  dependencies,
  dependenciesPriority,
  dependenciesSoft,
  feature,
  key,
}) => {
  const featureProviderProviderServer: FeatureProviderProviderServer<any, any, any> = (props) => {
    const featureProviderServer: Partial<FeatureProviderServer<any, any, any>> = {
      dependencies,
      dependenciesPriority,
      dependenciesSoft,
      key,
      serverFeatureProps: props,
    }

    if (typeof feature === 'function') {
      featureProviderServer.feature = async ({
        config,
        featureProviderMap,
        isRoot,
        resolvedFeatures,
        unSanitizedEditorConfig,
      }) => {
        const toReturn = await feature({
          config,
          featureProviderMap,
          isRoot,
          props,
          resolvedFeatures,
          unSanitizedEditorConfig,
        })

        if (toReturn.sanitizedServerFeatureProps === null) {
          toReturn.sanitizedServerFeatureProps = props
        }
        return toReturn
      }
    } else {
      ;(feature as ServerFeature<any, any>).sanitizedServerFeatureProps = props
      featureProviderServer.feature = feature as ServerFeature<any, any>
    }
    return featureProviderServer as FeatureProviderServer<any, any, any>
  }

  return featureProviderProviderServer
}
