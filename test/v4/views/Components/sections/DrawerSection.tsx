'use client'

import { Button, Drawer, formatDrawerSlug, Gutter, useModal } from '@payloadcms/ui'
import React from 'react'

import { Section, Variant } from '../shared.js'

const DRAWER_SLUG_1 = formatDrawerSlug({ slug: 'demo-drawer-1', depth: 1 })
const DRAWER_SLUG_2 = formatDrawerSlug({ slug: 'demo-drawer-2', depth: 1 })
const DRAWER_SLUG_NESTED_1 = formatDrawerSlug({ slug: 'demo-drawer-nested-1', depth: 1 })
const DRAWER_SLUG_NESTED_2 = formatDrawerSlug({ slug: 'demo-drawer-nested-2', depth: 2 })
const DRAWER_SLUG_NESTED_3 = formatDrawerSlug({ slug: 'demo-drawer-nested-3', depth: 3 })

const NestedDrawerContent: React.FC<{
  currentDepth: number
  maxDepth: number
  slugs: (null | string)[]
}> = ({ currentDepth, maxDepth, slugs }) => {
  const { openModal } = useModal()
  const nextSlug = slugs[currentDepth]

  return (
    <Gutter>
      <p>
        This is drawer content at depth <strong>{currentDepth}</strong>.
      </p>
      {currentDepth < maxDepth && nextSlug && (
        <>
          <Button buttonStyle="secondary" onClick={() => openModal(nextSlug)}>
            Open Drawer (Depth {currentDepth + 1})
          </Button>
          <Drawer slug={nextSlug} title={`Nested Drawer (Depth ${currentDepth + 1})`}>
            <NestedDrawerContent
              currentDepth={currentDepth + 1}
              maxDepth={maxDepth}
              slugs={slugs}
            />
          </Drawer>
        </>
      )}
    </Gutter>
  )
}

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

      <Variant label="Nested Drawers (3 Deep)">
        <Button buttonStyle="secondary" onClick={() => openModal(DRAWER_SLUG_NESTED_1)}>
          Open Nested Drawer
        </Button>
        <Drawer slug={DRAWER_SLUG_NESTED_1} title="Drawer (Depth 1)">
          <NestedDrawerContent
            currentDepth={1}
            maxDepth={3}
            slugs={[null, DRAWER_SLUG_NESTED_2, DRAWER_SLUG_NESTED_3]}
          />
        </Drawer>
      </Variant>
    </Section>
  )
}
