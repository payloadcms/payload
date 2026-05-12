'use client'

import { Button, Drawer, formatDrawerSlug, Gutter, useModal } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

const DRAWER_SLUG_1 = formatDrawerSlug({ slug: 'demo-drawer-1', depth: 1 })
const DRAWER_SLUG_2 = formatDrawerSlug({ slug: 'demo-drawer-2', depth: 1 })

export const DrawerSection: React.FC<{ selectedComponent: string }> = ({ selectedComponent }) => {
  const { openModal } = useModal()

  return (
    <Section id="drawer" selectedComponent={selectedComponent} title="Drawer">
      <Variant label="Basic Drawer">
        <Button buttonStyle="secondary" onClick={() => openModal(DRAWER_SLUG_1)}>
          Open Basic Drawer
        </Button>
        <Drawer slug={DRAWER_SLUG_1} title="Basic Drawer">
          <Gutter>
            <p>This is the drawer content. You can put any content here.</p>
            <p>Drawers slide in from the right side of the screen.</p>
          </Gutter>
        </Drawer>
      </Variant>

      <Variant label="With Header Actions">
        <Button buttonStyle="secondary" onClick={() => openModal(DRAWER_SLUG_2)}>
          Open Drawer with Actions
        </Button>
        <Drawer
          headerActions={[{ label: 'Save', onClick: () => {}, style: 'primary' }]}
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
}
