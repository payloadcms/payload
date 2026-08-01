import { z } from 'zod'

import type { Payload } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

import { defineOperation } from '../../operations/defineOperation.js'
import { requestSchema } from '../../operations/schemaFields.js'
import { deleteStagedFile as deleteStagedUpload } from '../stagedUpload.js'

const deleteStagedFileSchema = z.looseObject({ req: requestSchema })

export const deleteStagedFile = defineOperation({
  action: 'deleteStagedFile',
  expose: {
    rest: [
      {
        handler: ({ invoke, req }) =>
          invoke({
            context: req.payload,
            input: { req },
            validate: false,
          }),
        method: 'delete',
        path: '/upload-instructions/:uploadId',
        wrapInternal: false,
      },
    ],
  },
  handler: async (_payload: Payload, input: { req: PayloadRequest }) =>
    deleteStagedUpload(input.req),
  input: deleteStagedFileSchema,
  target: 'upload',
})
