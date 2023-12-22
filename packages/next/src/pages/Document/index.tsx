import { SanitizedConfig } from 'payload/types'
import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { auth } from '../../utilities/auth'

export const Document = async ({
  collectionSlug,
  id,
  config: configPromise,
  searchParams,
}: {
  collectionSlug: string
  id: string
  config: Promise<SanitizedConfig>
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  const headers = getHeaders()

  await auth({
    headers,
    config: configPromise,
  })

  return <p>{`This is a document in collection: ${collectionSlug} with id: ${id}`}</p>
}
