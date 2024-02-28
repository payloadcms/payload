'use client'

import type { FeatureProviderProviderClient, ServerFeature } from './types'

import { useLexicalFeature } from '../../useLexicalFeature'

/**
 * Utility function to create a client component for the client feature
 */
export const createClientComponent = <ClientFeatureProps,>(
  clientFeature: FeatureProviderProviderClient<ClientFeatureProps>,
): ServerFeature<unknown, ClientFeatureProps>['ClientComponent'] => {
  return (props) => {
    useLexicalFeature(props.featureKey, clientFeature(props))
    return null
  }
}
