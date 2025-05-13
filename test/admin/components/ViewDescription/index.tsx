'use client'

import type { ViewDescriptionClientProps } from 'payload'

import { ViewDescription as DefaultViewDescription } from '@payloadcms/ui'
import React from 'react'

import { Banner } from '../Banner/index.js'

export function ViewDescription({
  description = 'This is a custom view description component.',
}: ViewDescriptionClientProps) {
  return (
    <Banner>
      <DefaultViewDescription description={description} />
    </Banner>
  )
}
