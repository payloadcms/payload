import { SanitizedConfig } from 'payload/types'
import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { auth } from '../../utilities/auth'

export const CollectionList = async ({
  searchParams,
  config: configPromise,
}: {
  searchParams: URLSearchParams
  config: Promise<SanitizedConfig>
}) => {
  const headers = getHeaders()

  await auth({
    headers,
    searchParams,
    config: configPromise,
  })

  return <p>This is the collection list view</p>
}
