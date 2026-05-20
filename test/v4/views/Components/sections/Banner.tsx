'use client'

import { Banner } from '@payloadcms/ui'
import React from 'react'

import { Section } from '../shared.js'

export const BannerSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section fullWidth id="banner" selectedComponent={selectedComponent} title="Banner">
    <Banner>This is a default banner.</Banner>
    <Banner type="brand">This is a brand banner.</Banner>
    <Banner type="danger">This is a danger banner.</Banner>
    <Banner type="success">This is a success banner.</Banner>
    <Banner type="warning">This is a warning banner.</Banner>
  </Section>
)
