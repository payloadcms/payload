'use client'

import type { SidebarTabClientProps } from 'payload'

import React from 'react'

import { TaxonomyTree } from './index.js'

export const TaxonomySidebarTab: React.FC<{ collectionSlug: string } & SidebarTabClientProps> = ({
  collectionSlug,
}) => {
  // This component receives the collection slug as a prop from the config
  // Each taxonomy collection gets its own tab with its slug passed in
  return (
    <div className="taxonomy-sidebar-tab">
      <TaxonomyTree collectionSlug={collectionSlug} key={collectionSlug} />
    </div>
  )
}
