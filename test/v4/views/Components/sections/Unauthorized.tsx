'use client'

import { Button } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const UnauthorizedSection: React.FC<{ selectedComponent: string }> = ({
  selectedComponent,
}) => (
  <Section id="unauthorized" selectedComponent={selectedComponent} title="Unauthorized">
    <Variant>
      <Button el="link" to="/admin/collections/unauthorized-test/create">
        Go To Unauthorized View
      </Button>
    </Variant>
  </Section>
)
