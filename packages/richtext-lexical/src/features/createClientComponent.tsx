'use client'

import type { FeatureProviderProviderClient, ServerFeature } from './types.js'

import { useLexicalFeature } from '../utilities/useLexicalFeature.js'

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
