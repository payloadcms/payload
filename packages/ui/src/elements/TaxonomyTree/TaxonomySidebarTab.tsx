'use client'

import type { SidebarTabClientProps } from 'payload'

import React from 'react'

import { TaxonomyTree } from './index.js'

export const TaxonomySidebarTab: React.FC<{ collectionSlug: string } & SidebarTabClientProps> = ({
  collectionSlug,
}) => {
  return (
    <div className="taxonomy-sidebar-tab">
      <TaxonomyTree collectionSlug={collectionSlug} key={collectionSlug} />
    </div>
  )
}
