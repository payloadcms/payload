'use client'

import { Banner } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../../shared.js'

export const PointFieldSection: React.FC = () => (
  <Section id="point-field" selectedComponent="point-field" title="Point">
    <Variant label="PointInput">
      <Banner type="default">
        <code>PointInput</code> — coming soon
      </Banner>
    </Variant>
  </Section>
)
