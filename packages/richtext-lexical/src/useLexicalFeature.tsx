'use client'

import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import { useAddClientFunction } from '@payloadcms/ui/providers/ClientFunction'

import type { FeatureProviderClient } from './field/features/types.js'

export const useLexicalFeature = <ClientFeatureProps,>(
  featureKey: string,
  feature: FeatureProviderClient<ClientFeatureProps>,
) => {
  const { schemaPath } = useFieldProps()

  useAddClientFunction(`lexicalFeature.${schemaPath}.${featureKey}`, feature)
}
