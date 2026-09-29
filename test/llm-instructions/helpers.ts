import type { Payload, PayloadRequest } from 'payload'

import { buildEditorState } from '@payloadcms/richtext-lexical'
import { instructionsCollectionSlug } from 'payload/shared'
import { expect } from 'vitest'

import type { PayloadLlmInstruction } from './payload-types.js'

import { devUser } from '../credentials.js'

export const additionalInstructions = buildEditorState<
  PayloadLlmInstruction['additionalInstructions']
>({ text: 'Keep page summaries under 100 words.' })

export const saveAdditionalInstructions = async ({
  collectionSlug,
  globalSlug,
  payload,
}: {
  collectionSlug?: string
  globalSlug?: string
  payload: Payload
}) => {
  const { user } = await payload.login({ collection: 'users', data: devUser })
  const doc = await findInstructions({ collectionSlug, globalSlug, payload, user })

  return payload.update({
    id: doc.id,
    collection: instructionsCollectionSlug,
    data: { additionalInstructions },
    overrideAccess: false,
    user,
  })
}

export const findInstructions = async ({
  collectionSlug,
  globalSlug,
  payload,
  user,
}: {
  collectionSlug?: string
  globalSlug?: string
  payload: Payload
  user: PayloadRequest['user']
}) => {
  const { docs } = await payload.find({
    collection: instructionsCollectionSlug,
    overrideAccess: false,
    user,
    where: collectionSlug
      ? { collectionSlug: { equals: collectionSlug } }
      : { globalSlug: { equals: globalSlug } },
  })

  expect(docs).toHaveLength(1)

  return docs[0]!
}
