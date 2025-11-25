import type { SlugFieldServerProps } from 'payload'
import type { Slugify } from 'payload/shared'

import { slugify as defaultSlugify } from 'payload/shared'
import React from 'react'

import { SlugFieldClient } from './index.client.js'

/**
 * @experimental This component is experimental and may change or be removed in the future. Use at your own risk.
 */
export const SlugField: React.FC<SlugFieldServerProps> = ({
  clientField,
  fieldToUse,
  path,
  readOnly: readOnlyFromProps,
  slugify,
}) => {
  const slugifyServerFn: Slugify = async (val) => {
    'use server'
    const fn = slugify || defaultSlugify

    const result = await fn(val)

    return result
  }

  return (
    <SlugFieldClient
      field={clientField}
      fieldToUse={fieldToUse}
      path={path}
      readOnly={readOnlyFromProps}
      slugify={slugifyServerFn}
    />
  )
}
