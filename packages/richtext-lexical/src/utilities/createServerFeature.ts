import type { SanitizedConfig } from 'payload'

import type {
  FeatureProviderProviderServer,
  FeatureProviderServer,
  ResolvedServerFeatureMap,
  ServerFeature,
  ServerFeatureProviderMap,
} from '../features/typesServer.js'
import type { ServerEditorConfig } from '../lexical/config/types.js'

export type CreateServerFeatureArgs<UnSanitizedProps, SanitizedProps, ClientProps> = {
  feature:
    | ((props: {
        config: SanitizedConfig
        /** unSanitizedEditorConfig.features, but mapped */
        featureProviderMap: ServerFeatureProviderMap
        isRoot?: boolean
        parentIsLocalized: boolean
        props: UnSanitizedProps
        // other resolved features, which have been loaded before this one. All features declared in 'dependencies' should be available here
        resolvedFeatures: ResolvedServerFeatureMap
        // unSanitized EditorConfig,
        unSanitizedEditorConfig: ServerEditorConfig
      }) =>
        | Promise<ServerFeature<SanitizedProps, ClientProps>>
        | ServerFeature<SanitizedProps, ClientProps>)
    | Omit<ServerFeature<SanitizedProps, ClientProps>, 'sanitizedServerFeatureProps'>
} & Pick<
  FeatureProviderServer<UnSanitizedProps, ClientProps>,
  'dependencies' | 'dependenciesPriority' | 'dependenciesSoft' | 'key'
>

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
        parentIsLocalized,
        resolvedFeatures,
        unSanitizedEditorConfig,
      }) => {
        const toReturn = await feature({
          config,
          featureProviderMap,
          isRoot,
          parentIsLocalized,
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
      // For explanation why we have to spread feature, see createClientFeature.ts
      const newFeature: ServerFeature<any, any> = { ...feature }

      newFeature.sanitizedServerFeatureProps = props
      featureProviderServer.feature = newFeature
    }
    return featureProviderServer as FeatureProviderServer<any, any, any>
  }

  return featureProviderProviderServer
}
