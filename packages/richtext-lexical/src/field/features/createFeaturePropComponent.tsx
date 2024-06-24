'use client'

import type React from 'react'

import { useFieldProps } from '@payloadcms/ui/forms/FieldPropsProvider'
import { useAddClientFunction } from '@payloadcms/ui/providers/ClientFunction'

const useLexicalFeatureProp = <T,>(featureKey: string, componentKey: string, prop: T) => {
  const { schemaPath } = useFieldProps()

  useAddClientFunction(
    `lexicalFeature.${schemaPath}.${featureKey}.components.${componentKey}`,
    prop,
  )
}

export const createFeaturePropComponent = <T = unknown,>(
  prop: T,
): React.FC<{ componentKey: string; featureKey: string }> => {
  return (props) => {
    useLexicalFeatureProp(props.featureKey, props.componentKey, prop)
    return null
  }
}
