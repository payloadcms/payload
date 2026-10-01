'use client'
import type { PointFieldClientProps } from 'payload'

import { PointField } from '@payloadcms/ui'
import React from 'react'

export const CustomPointFieldClient: React.FC<PointFieldClientProps> = (props) => {
  return <PointField {...props} />
}
