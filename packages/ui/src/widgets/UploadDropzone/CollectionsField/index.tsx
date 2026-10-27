'use client'

import type { SelectFieldClientProps } from 'payload'

import React, { useMemo } from 'react'

import { useAuth } from '../../../providers/Auth/index.js'
import { useEntityVisibility } from '../../../providers/EntityVisibility/index.js'
import { CollectionFilter } from '../../shared/CollectionFilter/index.js'

/**
 * @internal - may change or be removed without a major version bump
 */
export const UploadDropzoneCollectionsField: React.FC<SelectFieldClientProps> = (props) => {
  const { permissions } = useAuth()
  const { isEntityVisible } = useEntityVisibility()

  const field = useMemo(
    () => ({
      ...props.field,
      options: (props.field.options ?? []).filter((option) => {
        const collectionSlug = typeof option === 'string' ? option : option.value

        return (
          isEntityVisible({ collectionSlug }) && permissions?.collections?.[collectionSlug]?.create
        )
      }),
    }),
    [isEntityVisible, permissions, props.field],
  )

  return <CollectionFilter {...props} field={field} />
}
