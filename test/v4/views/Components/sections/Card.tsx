'use client'

import { Button, Card } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

export const CardSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="card" selectedComponent={selectedComponent} title="Card">
    <Variant label="Default">
      <Card title="Card Title" />
    </Variant>

    <Variant label="Clickable (with href)">
      <Card buttonAriaLabel="View Users" href="/admin/collections/users" title="Users" />
    </Variant>

    <Variant label="Clickable with Plus Button">
      <Card
        actions={
          <Button
            aria-label="Create new"
            buttonStyle="ghost"
            icon="plus"
            round
            size="medium"
            to="/admin/collections/users/create"
          />
        }
        buttonAriaLabel="View Users"
        href="/admin/collections/users"
        title="Users"
      />
    </Variant>

    <Variant label="With Actions Only">
      <Card
        actions={
          <Button buttonStyle="pill" size="medium">
            Action
          </Button>
        }
        title="Card with Actions"
      />
    </Variant>
  </Section>
)
