'use client'

import { FieldError, TextInput } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const InputSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="input" selectedComponent={selectedComponent} title="Input">
    <Variant>
      <TextInput label="Default" onChange={() => {}} path="input-default" value="" />
    </Variant>
    <Variant>
      <TextInput
        label="With Value"
        onChange={() => {}}
        path="input-value"
        value="Input with value"
      />
    </Variant>
    <Variant>
      <TextInput
        label="Read Only"
        onChange={() => {}}
        path="input-readonly"
        readOnly
        value="Read only value"
      />
    </Variant>
    <Variant>
      <TextInput
        Error={<FieldError message="This field is required" path="input-error" showError />}
        label="Error State"
        onChange={() => {}}
        path="input-error"
        showError
        value=""
      />
    </Variant>
  </Section>
)
