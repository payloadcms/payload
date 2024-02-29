'use client'
import { useAddClientFunction } from '@payloadcms/ui/providers'

import type { FeatureProvider } from './field/features/types'

import { useFieldPath } from '../../ui/src/forms/FieldPathProvider'

export const useLexicalFeature = (key: string, feature: FeatureProvider) => {
  const { schemaPath } = useFieldPath()

  useAddClientFunction(`lexicalFeature.${schemaPath}.${key}`, feature)
}
