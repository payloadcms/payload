'use client'

import { Banner } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../../shared.js'

export const JSONFieldSection: React.FC = () => (
  <Section id="json-field" selectedComponent="json-field" title="JSON">
    <Variant label="JSONInput">
      <Banner type="default">
        <code>JSONInput</code> — coming soon
      </Banner>
    </Variant>
  </Section>
)
