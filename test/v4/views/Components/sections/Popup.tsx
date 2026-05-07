'use client'

import { Button, Popup } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const PopupSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="popup" selectedComponent={selectedComponent} title="Popup">
    <Variant label="Default">
      <Popup
        button={<Button buttonStyle="secondary">Open Popup</Button>}
        buttonType="custom"
        render={() => (
          <div style={{ padding: '16px' }}>
            <p>Popup content goes here</p>
          </div>
        )}
      />
    </Variant>
    <Variant label="Horizontal: Right">
      <Popup
        button={<Button buttonStyle="secondary">Right Aligned</Button>}
        buttonType="custom"
        horizontalAlign="right"
        render={() => (
          <div style={{ padding: '16px' }}>
            <p>Right aligned popup</p>
          </div>
        )}
      />
    </Variant>
  </Section>
)
