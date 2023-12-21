import { SanitizedConfig } from 'payload/types'
import React from 'react'
import { initPage } from '../../utilities/initPage'

export const CollectionList = async ({
  searchParams,
  config: configPromise,
}: {
  searchParams: URLSearchParams
  config: Promise<SanitizedConfig>
}) => {
  await initPage(configPromise)
  return <p>This is the collection list view</p>
}
