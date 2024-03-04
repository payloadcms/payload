'use client'
import { useFieldPath } from '@payloadcms/ui/forms'
import { useAddClientFunction } from '@payloadcms/ui/providers'

import type { FeatureProviderClient } from './field/features/types'

export const useLexicalFeature = <ClientFeatureProps,>(
  featureKey: string,
  feature: FeatureProviderClient<ClientFeatureProps>,
) => {
  const { schemaPath } = useFieldPath()

  useAddClientFunction(`lexicalFeature.${schemaPath}.${featureKey}`, feature)
}
