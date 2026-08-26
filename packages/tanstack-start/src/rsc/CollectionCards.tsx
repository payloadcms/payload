import type { WidgetServerProps } from 'payload'

import { CollectionCardsClient } from '@payloadcms/ui/internal'
import { getCollectionCardsData } from '@payloadcms/ui/internal/server'
import React from 'react'

export async function CollectionCards(props: WidgetServerProps) {
  const data = await getCollectionCardsData(props.req)

  return <CollectionCardsClient {...data} />
}
