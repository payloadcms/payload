'use client'

import { SpinnerIcon } from '@payloadcms/ui/icons/Spinner'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const SpinnerSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => {
  return (
    <Section id="spinner" selectedComponent={selectedComponent} title="Spinner">
      <Variant label="Small (sm - 16px)">
        <SpinnerIcon size="sm" />
      </Variant>
      <Variant label="Medium (md - 24px small arc)">
        <SpinnerIcon size="md" />
      </Variant>
      <Variant label="Large (lg - 24px large arc)">
        <SpinnerIcon size="lg" />
      </Variant>
    </Section>
  )
}
