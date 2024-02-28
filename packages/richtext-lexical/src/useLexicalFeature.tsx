'use client'
import { useAddClientFunction } from '@payloadcms/ui/providers'

import type { FeatureProvider } from './field/features/types'

import { useFieldPath } from '../../ui/src/forms/FieldPathProvider'

type FeatureProviderGetter = () => FeatureProvider

export const useLexicalFeature = (key: string, feature: FeatureProviderGetter) => {
  const { schemaPath } = useFieldPath()

  useAddClientFunction(`lexicalFeature.${schemaPath}.${key}`, feature)
}
