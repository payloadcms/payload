'use client'
import React from 'react'

import { RenderFields, useComponentMap } from '@payloadcms/ui'

export const CreateFirstUserFields: React.FC<{
  userSlug: string
}> = ({ userSlug }) => {
  const { getFieldMap } = useComponentMap()

  const fieldMap = getFieldMap({ collectionSlug: userSlug })

  return <RenderFields fieldMap={fieldMap} />
}
