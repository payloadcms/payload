'use client'

import { IDLabel } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const IDLabelSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="id-label" selectedComponent={selectedComponent} title="IDLabel">
    <Variant label="Default">
      <IDLabel id="67s34n85ad624sd51f0d2759" />
    </Variant>
    <Variant label="Short ID">
      <IDLabel id="abc123" />
    </Variant>
    <Variant label="Numeric ID">
      <IDLabel id="12345" />
    </Variant>
    <Variant label="Custom Prefix">
      <IDLabel id="67s34n85ad624sd51f0d2759" prefix="Doc" />
    </Variant>
  </Section>
)
