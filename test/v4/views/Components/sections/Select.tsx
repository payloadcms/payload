'use client'

import { ReactSelect } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

const options = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
  { label: 'Option 3', value: 'option3' },
]

export const SelectSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="select" selectedComponent={selectedComponent} title="Select (ReactSelect)">
    <Variant label="Default">
      <ReactSelect onChange={() => {}} options={options} value={undefined} />
    </Variant>
    <Variant label="With Value">
      <ReactSelect
        onChange={() => {}}
        options={options}
        value={{ label: 'Option 2', value: 'option2' }}
      />
    </Variant>
    <Variant label="Disabled">
      <ReactSelect disabled onChange={() => {}} options={options} value={undefined} />
    </Variant>
    <Variant label="Error">
      <ReactSelect onChange={() => {}} options={options} showError value={undefined} />
    </Variant>
  </Section>
)
