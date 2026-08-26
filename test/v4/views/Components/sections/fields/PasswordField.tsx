'use client'

import { Banner } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../../shared.js'

export const PasswordFieldSection: React.FC = () => (
  <Section id="password-field" selectedComponent="password-field" title="Password">
    <Variant label="PasswordInput">
      <Banner type="default">
        <code>PasswordInput</code> — coming soon
      </Banner>
    </Variant>
  </Section>
)
