'use client'

import { FieldError, TextareaInput } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const TextareaSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="textarea" selectedComponent={selectedComponent} title="Textarea">
    <Variant>
      <TextareaInput label="Default" onChange={() => {}} path="textarea-default" value="" />
    </Variant>
    <Variant>
      <TextareaInput
        label="With Value"
        onChange={() => {}}
        path="textarea-value"
        value="Textarea with some content that spans multiple lines if needed."
      />
    </Variant>
    <Variant>
      <TextareaInput
        label="Read Only"
        onChange={() => {}}
        path="textarea-readonly"
        readOnly
        value="Read only"
      />
    </Variant>
    <Variant>
      <TextareaInput
        Error={<FieldError message="This field is required" path="textarea-error" showError />}
        label="Error"
        onChange={() => {}}
        path="textarea-error"
        showError
        value=""
      />
    </Variant>
  </Section>
)
