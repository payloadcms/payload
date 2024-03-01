'use client'
import { useAddClientFunction } from '@payloadcms/ui/providers'

import type { FeatureProviderClient } from './field/features/types'

import { useFieldPath } from '../../ui/src/forms/FieldPathProvider'

export const useLexicalFeature = <ClientFeatureProps,>(
  featureKey: string,
  feature: FeatureProviderClient<ClientFeatureProps>,
) => {
  const { schemaPath } = useFieldPath()

  useAddClientFunction(`lexicalFeature.${schemaPath}.${featureKey}`, feature)
}
