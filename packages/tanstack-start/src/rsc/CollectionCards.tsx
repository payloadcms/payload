import type { WidgetServerProps } from 'payload'

import { getCollectionCardsData } from '@payloadcms/ui/server'
import { CollectionCardsClient } from '@payloadcms/ui/widgets/CollectionCards/index.client'
import React from 'react'

export async function CollectionCards(props: WidgetServerProps) {
  const data = await getCollectionCardsData(props.req)

  return <CollectionCardsClient {...data} />
}
