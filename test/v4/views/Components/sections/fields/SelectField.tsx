'use client'

import { FieldError, SelectInput } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../../shared.js'

const options = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
  { label: 'Option 3', value: 'option3' },
]

export const SelectFieldSection: React.FC = () => (
  <Section id="select-field" selectedComponent="select-field" title="Select">
    <Variant>
      <SelectInput
        label="Default"
        name="select"
        onChange={() => {}}
        options={options}
        path="select"
        value={undefined}
      />
    </Variant>
    <Variant>
      <SelectInput
        label="With Value"
        name="select"
        onChange={() => {}}
        options={options}
        path="select"
        value="option2"
      />
    </Variant>
    <Variant>
      <SelectInput
        hasMany
        label="Has Many"
        name="select-many"
        onChange={() => {}}
        options={options}
        path="select-many"
        value={['option1', 'option3']}
      />
    </Variant>
    <Variant>
      <SelectInput
        Error={<FieldError message="Please select an option" path="select-error" showError />}
        label="Error"
        name="select-error"
        onChange={() => {}}
        options={options}
        path="select-error"
        showError
        value={undefined}
      />
    </Variant>
  </Section>
)
