import type { WidgetServerProps } from 'payload'

import React from 'react'

import type { CollectionCardsData } from './getCollectionCardsData.js'

import { getCollectionCardsData } from './getCollectionCardsData.js'
import { CollectionCardsClient } from './index.client.js'
import './index.css'

export type { CollectionCardsData }

export { CollectionCardsClient }
export { getCollectionCardsData }

export function CollectionCardsView(props: CollectionCardsData) {
  return <CollectionCardsClient {...props} />
}

export async function CollectionCards(props: WidgetServerProps) {
  const data = await getCollectionCardsData(props.req)
  return <CollectionCardsClient {...data} />
}
