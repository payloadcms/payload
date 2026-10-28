'use client'

import { Banner, TrashIcon } from '@payloadcms/ui'
import React from 'react'

import { Section } from '../shared.js'

export const TrashBannerSection: React.FC<{ selectedComponent: string }> = ({
  selectedComponent,
}) => (
  <Section fullWidth id="trash-banner" selectedComponent={selectedComponent} title="Trash Banner">
    <Banner icon={<TrashIcon />} type="warning">
      This document has been trashed.
    </Banner>
  </Section>
)
