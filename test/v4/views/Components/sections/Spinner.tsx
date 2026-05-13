'use client'

import { SpinnerIcon } from '@payloadcms/ui/icons/Spinner'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const SpinnerSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => {
  return (
    <Section id="spinner" selectedComponent={selectedComponent} title="Spinner">
      <Variant label="Small (16px)">
        <SpinnerIcon size={16} />
      </Variant>
      <Variant label="Medium (24px)">
        <SpinnerIcon size={24} />
      </Variant>
      <Variant label="Large (32px)">
        <SpinnerIcon size={32} />
      </Variant>
    </Section>
  )
}
