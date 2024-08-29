'use client'

import type React from 'react'

import type { ClientComponentProps, FeatureProviderProviderClient } from './typesClient.js'

import { useLexicalFeature } from '../utilities/useLexicalFeature.js'

/**
 * Utility function to create a client component for the client feature
 */
export const createClientComponent = <ClientFeatureProps,>(
  clientFeature: FeatureProviderProviderClient<ClientFeatureProps>,
): React.FC<ClientComponentProps<ClientFeatureProps>> => {
  return (props) => {
    useLexicalFeature(props.featureKey, clientFeature(props))
    return null
  }
}
