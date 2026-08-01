import { z } from 'zod'

import type { Payload } from '../../index.js'
import type { PayloadRequest, Where } from '../../types/index.js'

import { defineOperation } from '../../operations/defineOperation.js'
import { collectionSchema, requestSchema } from '../../operations/schemaFields.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'

const initializeAuth = async (args: {
  collection: string
  req: PayloadRequest
}): Promise<boolean> => {
  const { collection: slug, req } = args

  const collectionConfig = req.payload.config.collections?.find((c) => c.slug === slug)

  // Exclude trashed documents unless `trash: true`
  const where: Where = appendNonTrashedFilter({
    enableTrash: Boolean(collectionConfig?.trash),
    trash: false,
    where: {},
  })

  const doc = await req.payload.db.findOne({
    collection: slug,
    req,
    where,
  })

  return !!doc
}

const initSchema = z.looseObject({
  collection: collectionSchema,
  req: requestSchema,
})

export const init = defineOperation({
  action: 'init',
  expose: {
    rest: [
      {
        handler: async ({ invoke, req }) => {
          const initialized = await invoke({
            context: req.payload,
            input: { collection: getRequestCollection(req).config.slug, req },
            validate: false,
          })

          return Response.json(
            { initialized },
            { headers: headersWithCors({ headers: new Headers(), req }) },
          )
        },
        method: 'get',
        path: '/init',
      },
    ],
  },
  handler: (_payload: Payload, input: { collection: string; req: PayloadRequest }) =>
    initializeAuth(input),
  input: initSchema,
  target: 'auth',
})
