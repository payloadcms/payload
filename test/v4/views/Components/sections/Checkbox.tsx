'use client'

import { CheckboxInput, FieldError } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const CheckboxSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="checkbox" selectedComponent={selectedComponent} title="Checkbox">
    <Variant>
      <CheckboxInput checked={false} label="Unchecked" onToggle={() => {}} />
    </Variant>
    <Variant>
      <CheckboxInput checked={true} label="Checked" onToggle={() => {}} />
    </Variant>
    <Variant>
      <CheckboxInput
        checked={false}
        label="Indeterminate"
        onToggle={() => {}}
        partialChecked={true}
      />
    </Variant>
    <Variant>
      <CheckboxInput
        checked={false}
        Error={
          <FieldError
            alignCaret="left"
            message="This field is required"
            path="checkbox-error"
            showError
          />
        }
        label="Error"
        onToggle={() => {}}
      />
    </Variant>
    <Variant label="Muted Unchecked">
      <CheckboxInput checked={false} label="Unchecked" onToggle={() => {}} variant="muted" />
    </Variant>
    <Variant label="Muted Checked">
      <CheckboxInput checked={true} label="Checked" onToggle={() => {}} variant="muted" />
    </Variant>
    <Variant label="Muted Indeterminate">
      <CheckboxInput
        checked={false}
        label="Indeterminate"
        onToggle={() => {}}
        partialChecked={true}
        variant="muted"
      />
    </Variant>
  </Section>
)
