'use client'
import type { SanitizedCollectionConfig } from 'payload'

import React from 'react'

export type Props = {
  readonly collectionSlug: SanitizedCollectionConfig['slug']
}

export const GroupBySelector: React.FC<Props> = ({ collectionSlug }) => {
  return <div>Group By</div>
}
