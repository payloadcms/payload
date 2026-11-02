'use client'

import { DatePicker } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../../shared.js'

// Read once, since render can't read the current time
const now = new Date()

export const DateFieldSection: React.FC = () => (
  <Section id="date-field" selectedComponent="date-field" title="Date">
    <Variant label="Default">
      <DatePicker onChange={() => {}} value={undefined} />
    </Variant>
    <Variant label="With Value">
      <DatePicker onChange={() => {}} value={new Date('2024-01-15')} />
    </Variant>
    <Variant label="Day and Time">
      <DatePicker onChange={() => {}} pickerAppearance="dayAndTime" value={now} />
    </Variant>
    <Variant label="Time Only">
      <DatePicker onChange={() => {}} pickerAppearance="timeOnly" value={now} />
    </Variant>
  </Section>
)
