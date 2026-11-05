'use client'

import { RenderTitle } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const RenderTitleSection: React.FC<{ selectedComponent: string }> = ({
  selectedComponent,
}) => (
  <Section id="render-title" selectedComponent={selectedComponent} title="RenderTitle">
    <Variant label="With Title">
      <RenderTitle title="My Document Title" />
    </Variant>
    <Variant label="Fallback Text">
      <RenderTitle fallback="[Untitled]" />
    </Variant>
    <Variant label="ID as Title (fallbackToID)">
      <RenderTitle fallbackToID title="67s34n85ad624sd51f0d2759" />
    </Variant>
    <Variant label="Custom Element (h2)">
      <RenderTitle element="h2" title="Heading Level 2" />
    </Variant>
    <Variant label="Custom Element (span)">
      <RenderTitle element="span" title="Span Element" />
    </Variant>
  </Section>
)
