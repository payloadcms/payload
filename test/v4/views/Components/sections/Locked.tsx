'use client'

import { Locked } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const LockedSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => {
  return (
    <Section id="locked" selectedComponent={selectedComponent} title="Locked">
      <Variant label="Default">
        <Locked user={{ id: '1', email: 'Another user' } as any} />
      </Variant>
    </Section>
  )
}
