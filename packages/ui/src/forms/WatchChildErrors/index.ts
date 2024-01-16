'use client'
import React from 'react'

import type { Field, TabAsField } from 'payload/types'

import { fieldAffectsData, fieldHasSubFields, tabHasName } from 'payload/types'
import useThrottledEffect from '../../hooks/useThrottledEffect'
import { useAllFormFields, useFormSubmitted } from '../Form/context'
import type { FormState } from '../Form/types'

export const buildPathSegments = (parentPath: string, fieldSchema: Field[]): string[] => {
  const pathNames = fieldSchema.reduce((acc, subField) => {
    if (fieldHasSubFields(subField) && fieldAffectsData(subField)) {
      // group, block, array
      acc.push(parentPath ? `${parentPath}.${subField.name}.` : `${subField.name}.`)
    } else if (fieldHasSubFields(subField)) {
      // rows, collapsibles, unnamed-tab
      acc.push(...buildPathSegments(parentPath, subField.fields))
    } else if (subField.type === 'tabs') {
      // tabs
      subField.tabs.forEach((tab: TabAsField) => {
        let tabPath = parentPath
        if (tabHasName(tab)) {
          tabPath = parentPath ? `${parentPath}.${tab.name}` : tab.name
        }
        acc.push(...buildPathSegments(tabPath, tab.fields))
      })
    } else if (fieldAffectsData(subField)) {
      // text, number, date, etc.
      acc.push(parentPath ? `${parentPath}.${subField.name}` : subField.name)
    }

    return acc
  }, [])

  return pathNames
}

export const mapFieldsAndReturnErrorCount = ({
  formState,
  pathSegments,
}: {
  formState: FormState
  pathSegments: string[]
}): number => {
  let errorCount = 0

  Object.entries(formState).forEach(([key]) => {
    const matchingSegment = pathSegments.some((segment) => {
      if (segment.endsWith('.')) {
        return key.startsWith(segment)
      }
      return key === segment
    })

    if (matchingSegment) {
      const fieldState = formState[key]
      if ('valid' in fieldState && !fieldState.valid) {
        errorCount += 1
      }
    }
  })

  return errorCount
}

export const checkStateForErrors = ({
  formState,
  fieldSchema,
  path,
}: {
  formState: FormState
  fieldSchema: Field[]
  path: string
}): number => {
  const pathSegments = buildPathSegments(path, fieldSchema)
  return mapFieldsAndReturnErrorCount({ formState, pathSegments })
}

type TrackSubSchemaErrorCountProps = {
  /**
   * Only for collapsibles, and unnamed-tabs
   */
  fieldSchema?: Field[]
  path: string
  setErrorCount: (count: number) => void
}

export const WatchChildErrors: React.FC<TrackSubSchemaErrorCountProps> = ({
  fieldSchema,
  path,
  setErrorCount,
}) => {
  const [formState] = useAllFormFields()
  const hasSubmitted = useFormSubmitted()
  const [pathSegments] = React.useState(() => {
    if (fieldSchema) {
      return buildPathSegments(path, fieldSchema)
    }

    return [`${path}.`]
  })

  useThrottledEffect(
    () => {
      if (hasSubmitted) {
        const errorCount = mapFieldsAndReturnErrorCount({ formState, pathSegments })
        setErrorCount(errorCount)
      }
    },
    250,
    [formState, hasSubmitted, pathSegments],
  )

  return null
}
