'use client'

import { FieldError, TextInput } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../../shared.js'

export const TextFieldSection: React.FC = () => (
  <Section id="text-field" selectedComponent="text-field" title="Text">
    <Variant>
      <TextInput label="Default" onChange={() => {}} path="text" value="" />
    </Variant>
    <Variant>
      <TextInput label="With Value" onChange={() => {}} path="text" value="Hello World" />
    </Variant>
    <Variant>
      <TextInput
        label="Read Only"
        onChange={() => {}}
        path="text"
        readOnly
        value="Read only text"
      />
    </Variant>
    <Variant>
      <TextInput
        Error={<FieldError message="This field is required" path="text-error" showError />}
        label="Error"
        onChange={() => {}}
        path="text-error"
        showError
        value=""
      />
    </Variant>
  </Section>
)
