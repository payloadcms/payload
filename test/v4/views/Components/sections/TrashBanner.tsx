'use client'

import { Banner } from '@payloadcms/ui'
import { TrashIcon } from '@payloadcms/ui/icons/Trash'
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
