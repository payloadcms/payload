import type { WidgetServerProps } from 'payload'

import {
  CollectionCardsClient,
  getCollectionCardsData,
} from '@payloadcms/ui/widgets/CollectionCards'
import React from 'react'

export async function CollectionCards(props: WidgetServerProps) {
  const data = await getCollectionCardsData(props.req)

  return <CollectionCardsClient {...data} />
}
