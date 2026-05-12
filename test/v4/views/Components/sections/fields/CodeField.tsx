'use client'

import { Banner } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../../shared.js'

export const CodeFieldSection: React.FC = () => (
  <Section id="code-field" selectedComponent="code-field" title="Code">
    <Variant label="CodeInput">
      <Banner type="default">
        <code>CodeInput</code> — coming soon
      </Banner>
    </Variant>
  </Section>
)
