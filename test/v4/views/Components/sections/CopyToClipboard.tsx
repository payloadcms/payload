'use client'

import { CopyToClipboard } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const CopyToClipboardSection: React.FC<{ selectedComponent: string }> = ({
  selectedComponent,
}) => {
  return (
    <Section id="copy-to-clipboard" selectedComponent={selectedComponent} title="CopyToClipboard">
      <Variant label="Default">
        <CopyToClipboard value="Here is some copied text" />
      </Variant>
      <Variant label="Custom Message">
        <CopyToClipboard
          defaultMessage="Copy URL"
          successMessage="URL copied"
          value="https://payloadcms.com"
        />
      </Variant>
    </Section>
  )
}
