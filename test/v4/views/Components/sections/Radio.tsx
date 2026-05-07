'use client'

import { Banner } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const RadioSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="radio" selectedComponent={selectedComponent} title="Radio">
    <Variant label="RadioInput">
      <Banner type="default">
        <code>RadioInput</code> — coming soon
      </Banner>
    </Variant>
  </Section>
)
