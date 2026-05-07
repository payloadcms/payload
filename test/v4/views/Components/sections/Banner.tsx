'use client'

import { Banner } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const BannerSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="banner" selectedComponent={selectedComponent} title="Banner">
    <Variant label="Default">
      <Banner>Default banner message</Banner>
    </Variant>
    <Variant label="Success">
      <Banner type="success">Success! Operation completed.</Banner>
    </Variant>
    <Variant label="Error">
      <Banner type="error">Error! Something went wrong.</Banner>
    </Variant>
  </Section>
)
