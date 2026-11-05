'use client'

import { FieldError, TextareaInput } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../../shared.js'

export const TextareaFieldSection: React.FC = () => (
  <Section id="textarea-field" selectedComponent="textarea-field" title="Textarea">
    <Variant>
      <TextareaInput label="Default" onChange={() => {}} path="textarea" value="" />
    </Variant>
    <Variant>
      <TextareaInput
        label="With Value"
        onChange={() => {}}
        path="textarea"
        value="This is a longer piece of text that spans multiple lines in the textarea field."
      />
    </Variant>
    <Variant>
      <TextareaInput
        label="Read Only"
        onChange={() => {}}
        path="textarea"
        readOnly
        value="Read only content"
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
