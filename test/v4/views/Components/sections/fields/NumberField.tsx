'use client'

import { Banner } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../../shared.js'

export const NumberFieldSection: React.FC = () => (
  <Section id="number-field" selectedComponent="number-field" title="Number">
    <Variant label="NumberInput">
      <Banner type="default">
        <code>NumberInput</code> — coming soon
      </Banner>
    </Variant>
  </Section>
)
