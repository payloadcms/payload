import { SanitizedConfig } from 'payload/types'
import React from 'react'
import { cookies as getCookies, headers as getHeaders } from 'next/headers'
import { auth } from '../../utilities/auth'

export const CollectionList = async ({
  searchParams,
  config: configPromise,
}: {
  searchParams: URLSearchParams
  config: Promise<SanitizedConfig>
}) => {
  const cookies = getCookies()
  const headers = getHeaders()

  const config = await configPromise

  await auth({
    cookies,
    headers,
    searchParams,
    config: configPromise,
  })

  return <p>This is the collection list view</p>
}
