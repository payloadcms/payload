'use client'

import { Button, Drawer, DrawerToggler, formatDrawerSlug, Gutter } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

const DRAWER_SLUG_1 = formatDrawerSlug({ slug: 'demo-drawer-1', depth: 1 })
const DRAWER_SLUG_2 = formatDrawerSlug({ slug: 'demo-drawer-2', depth: 1 })

export const DrawerSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => (
  <Section id="drawer" selectedComponent={selectedComponent} title="Drawer">
    <Variant label="Basic Drawer">
      <DrawerToggler slug={DRAWER_SLUG_1}>
        <Button buttonStyle="secondary">Open Basic Drawer</Button>
      </DrawerToggler>
      <Drawer slug={DRAWER_SLUG_1} title="Basic Drawer">
        <Gutter>
          <p>This is the drawer content. You can put any content here.</p>
          <p>Drawers slide in from the right side of the screen.</p>
        </Gutter>
      </Drawer>
    </Variant>

    <Variant label="With Header Actions">
      <DrawerToggler slug={DRAWER_SLUG_2}>
        <Button buttonStyle="secondary">Open Drawer with Actions</Button>
      </DrawerToggler>
      <Drawer
        headerActions={<Button buttonStyle="primary">Save</Button>}
        slug={DRAWER_SLUG_2}
        title="Edit Document"
      >
        <Gutter>
          <p>This drawer has action buttons in the header.</p>
          <p>
            Use <code>headerActions</code> prop to add buttons.
          </p>
        </Gutter>
      </Drawer>
    </Variant>
  </Section>
)
