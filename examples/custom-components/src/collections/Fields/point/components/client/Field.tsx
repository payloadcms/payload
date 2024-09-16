'use client'
import type { PointFieldClientComponent } from 'payload'

import { PointField } from '@payloadcms/ui'
import React from 'react'

export const CustomPointFieldClient: PointFieldClientComponent = ({ field }) => {
  return <PointField field={field} />
}
