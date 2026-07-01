'use client'

import { FieldError, TextInput } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../../shared.js'

export const EmailFieldSection: React.FC = () => (
  <Section id="email-field" selectedComponent="email-field" title="Email">
    <Variant>
      <TextInput label="Default" onChange={() => {}} path="email" value="" />
    </Variant>
    <Variant>
      <TextInput label="With Value" onChange={() => {}} path="email" value="user@example.com" />
    </Variant>
    <Variant>
      <TextInput
        Error={<FieldError message="Please enter a valid email" path="email-error" showError />}
        label="Error"
        onChange={() => {}}
        path="email-error"
        showError
        value=""
      />
    </Variant>
  </Section>
)
