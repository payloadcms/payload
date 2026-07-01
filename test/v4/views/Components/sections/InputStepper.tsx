'use client'

import { InputStepper } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const InputStepperSection: React.FC<{ selectedComponent: string }> = ({
  selectedComponent,
}) => (
  <Section id="input-stepper" selectedComponent={selectedComponent} title="Input Stepper">
    <Variant label="Default">
      <InputStepper onDecrement={() => {}} onIncrement={() => {}} />
    </Variant>
    <Variant label="Disabled">
      <InputStepper disabled onDecrement={() => {}} onIncrement={() => {}} />
    </Variant>
  </Section>
)
