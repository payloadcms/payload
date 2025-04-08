'use server'
import type { CollectionSlug } from 'payload'

import { refresh } from '@payloadcms/next/server-functions'

import config from '../config.js'

type RefreshArgs = {
  collection: CollectionSlug
}

export async function refreshFunction({ collection }: RefreshArgs) {
  return await refresh({
    collection,
    config,
  })
}
