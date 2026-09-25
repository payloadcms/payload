'use client'

import { Dropzone } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

const noop = () => {
  // no-op for demo
}

const DropzoneContent: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      minHeight: '3.5rem',
      padding: '1rem',
      width: '100%',
    }}
  >
    {text}
  </div>
)

export const DropzoneSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => {
  return (
    <Section fullWidth id="dropzone" selectedComponent={selectedComponent} title="Dropzone">
      <Variant label="Default">
        <Dropzone onChange={noop}>
          <DropzoneContent text="Drag files here or click to upload" />
        </Dropzone>
      </Variant>
      <Variant label="Error / Invalid">
        <Dropzone hasError onChange={noop}>
          <DropzoneContent text="Invalid file type" />
        </Dropzone>
      </Variant>
      <Variant label="Dragging">
        <Dropzone className="dragging" onChange={noop}>
          <DropzoneContent text="Drop files here" />
        </Dropzone>
      </Variant>
      <Variant label="Focus">
        <Dropzone className="focused" onChange={noop}>
          <DropzoneContent text="Focused" />
        </Dropzone>
      </Variant>
    </Section>
  )
}
