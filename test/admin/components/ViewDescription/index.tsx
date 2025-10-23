'use client'

import type { ViewDescriptionClientProps } from 'payload'

import { ViewDescription as DefaultViewDescription } from '@payloadcms/ui'
import React from 'react'

import { Banner } from '../Banner/index.js'
import './index.scss'

const baseClass = 'view-description'

export function ViewDescription({
  description = 'This is a custom view description component.',
}: ViewDescriptionClientProps) {
  return (
    <Banner className={baseClass}>
      <DefaultViewDescription description={description} />
    </Banner>
  )
}
