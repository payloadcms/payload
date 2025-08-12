'use client'
import type { PointFieldClientComponent } from 'payload'

import { PointField } from '@payloadcms/ui'
import React from 'react'

export const CustomPointFieldClient: PointFieldClientComponent = (props) => {
  return <PointField {...props} />
}
