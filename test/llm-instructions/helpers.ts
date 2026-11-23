import type { Payload, PayloadRequest } from 'payload'

import { buildEditorState } from '@payloadcms/richtext-lexical'
import { instructionsCollectionSlug } from 'payload/shared'

import type { PayloadLlmInstruction } from './payload-types.js'

import { devUser } from '../credentials.js'

export const additionalInstructions = buildEditorState<
  PayloadLlmInstruction['additionalInstructions']
>({ text: 'Keep page summaries under 100 words.' })

export const saveAdditionalInstructions = async ({
  entitySlug,
  entityType,
  payload,
}: {
  entitySlug: string
  entityType: 'collection' | 'global'
  payload: Payload
}) => {
  const { user } = await payload.login({ collection: 'users', data: devUser })
  const doc = await findInstructions({ entitySlug, entityType, payload, user })

  return payload.update({
    id: doc.id,
    collection: instructionsCollectionSlug,
    data: { additionalInstructions },
    overrideAccess: false,
    user,
  })
}

export const findInstructions = async ({
  entitySlug,
  entityType,
  payload,
  user,
}: {
  entitySlug: string
  entityType: 'collection' | 'global'
  payload: Payload
  user: PayloadRequest['user']
}) => {
  const doc = await payload.findByID({
    id: `${entityType}-${entitySlug}`,
    collection: instructionsCollectionSlug,
    overrideAccess: false,
    user,
  })

  return doc
}
