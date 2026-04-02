'use client'

import { Gutter } from '@payloadcms/ui'
import { FormHeader } from '@payloadcms/ui/elements/FormHeader'
import React from 'react'

export const getRedirectURL = (error: unknown): null | string => {
  if (!error || typeof error !== 'object') {
    return null
  }

  if ('href' in error && typeof error.href === 'string') {
    return error.href
  }

  if ('to' in error && typeof error.to === 'string') {
    return error.to
  }

  return null
}

export const isNotFoundError = (error: unknown): boolean =>
  error instanceof Error && error.message === 'not-found'

export function UnsupportedView(props: { description: string; title: string }) {
  return (
    <Gutter>
      <FormHeader description={props.description} heading={props.title} />
    </Gutter>
  )
}
