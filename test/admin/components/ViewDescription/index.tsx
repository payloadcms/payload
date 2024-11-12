'use client'

import type { StaticDescription } from 'payload'

import { ViewDescription as DefaultViewDescription } from '@payloadcms/ui'
import React from 'react'

import { Banner } from '../Banner/index.js'

export const ViewDescription: React.FC<{ description: StaticDescription }> = ({
  description = 'This is a custom view description component.',
}) => {
  return (
    <Banner>
      <DefaultViewDescription description={description} />
    </Banner>
  )
}
