import React from 'react'

import type { CollectionCardsData } from './getCollectionCardsData.js'

import { CollectionCardsClient } from './index.client.js'
import './index.css'

export type { CollectionCardsData }

export { CollectionCardsClient }
export { getCollectionCardsData } from './getCollectionCardsData.js'

export function CollectionCardsView(props: CollectionCardsData) {
  return <CollectionCardsClient {...props} />
}
