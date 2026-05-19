'use client'

import { Banner } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../../shared.js'

export const RadioGroupFieldSection: React.FC = () => (
  <Section id="radiogroup-field" selectedComponent="radiogroup-field" title="Radio Group">
    <Variant label="RadioGroupInput">
      <Banner type="default">
        <code>RadioGroupInput</code> — coming soon
      </Banner>
    </Variant>
  </Section>
)
