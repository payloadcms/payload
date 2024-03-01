'use client'

import type React from 'react'

import { useAddClientFunction, useFieldPath } from '@payloadcms/ui'

const useLexicalFeatureProp = <T,>(featureKey: string, componentKey: string, prop: T) => {
  const { schemaPath } = useFieldPath()

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
