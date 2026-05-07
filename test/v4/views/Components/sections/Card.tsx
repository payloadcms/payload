'use client'

import { Button, Card } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const CardSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="card" selectedComponent={selectedComponent} title="Card">
    <Variant label="Default">
      <Card title="Card Title">
        <p>Card content goes here.</p>
      </Card>
    </Variant>
    <Variant label="With Actions">
      <Card
        actions={
          <Button buttonStyle="pill" size="small">
            Action
          </Button>
        }
        title="Card with Actions"
      >
        <p>This card has action buttons.</p>
      </Card>
    </Variant>
  </Section>
)
