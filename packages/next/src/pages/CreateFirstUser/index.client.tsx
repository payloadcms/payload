'use client'
import { RenderFields, useComponentMap } from '@payloadcms/ui'
import React from 'react'

export const CreateFirstUserFields: React.FC<{
  userSlug: string
}> = ({ userSlug }) => {
  const { getFieldMap } = useComponentMap()

  const fieldMap = getFieldMap({ collectionSlug: userSlug })

  return <RenderFields fieldMap={fieldMap} />
}
