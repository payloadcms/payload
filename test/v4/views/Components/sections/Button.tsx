'use client'

import { Button } from '@payloadcms/ui'
import { PlusIcon } from '@payloadcms/ui/icons/Plus'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const ButtonSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="button" selectedComponent={selectedComponent} title="Button">
    <Variant label="Default">
      <Button>Default Button</Button>
    </Variant>
    <Variant label="Secondary">
      <Button buttonStyle="secondary">Secondary</Button>
    </Variant>
    <Variant label="Pill">
      <Button buttonStyle="pill">Pill Style</Button>
    </Variant>
    <Variant label="Ghost">
      <Button buttonStyle="ghost">Ghost</Button>
    </Variant>
    <Variant label="Destructive">
      <Button buttonStyle="destructive">Destructive</Button>
    </Variant>
    <Variant label="With Icon">
      <Button icon={<PlusIcon />} iconPosition="left">
        With Icon
      </Button>
    </Variant>
    <Variant label="Icon Only">
      <Button icon={<PlusIcon />} iconStyle="without-border" round />
    </Variant>
    <Variant label="Disabled">
      <Button disabled>Disabled</Button>
    </Variant>
    <Variant label="Size: Small">
      <Button size="small">Small</Button>
    </Variant>
    <Variant label="Size: Medium">
      <Button size="medium">Medium</Button>
    </Variant>
    <Variant label="Size: Large">
      <Button size="large">Large</Button>
    </Variant>
  </Section>
)
