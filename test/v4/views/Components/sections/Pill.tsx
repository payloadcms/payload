'use client'

import { Pill } from '@payloadcms/ui'
import { PlusIcon } from '@payloadcms/ui/icons/Plus'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const PillSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="pill" selectedComponent={selectedComponent} title="Pill">
    <Variant label="Default (Light)">
      <Pill>Default</Pill>
    </Variant>
    <Variant label="Success">
      <Pill pillStyle="success">Success</Pill>
    </Variant>
    <Variant label="Warning">
      <Pill pillStyle="warning">Warning</Pill>
    </Variant>
    <Variant label="Error">
      <Pill pillStyle="error">Error</Pill>
    </Variant>
    <Variant label="Light Gray">
      <Pill pillStyle="light-gray">Light Gray</Pill>
    </Variant>
    <Variant label="Dark">
      <Pill pillStyle="dark">Dark</Pill>
    </Variant>
    <Variant label="White">
      <Pill pillStyle="white">White</Pill>
    </Variant>
    <Variant label="Always White">
      <Pill pillStyle="always-white">Always White</Pill>
    </Variant>
    <Variant label="With Icon">
      <Pill icon={<PlusIcon />}>With Icon</Pill>
    </Variant>
    <Variant label="Rounded">
      <Pill rounded>Rounded</Pill>
    </Variant>
  </Section>
)
