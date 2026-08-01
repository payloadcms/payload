import { z } from 'zod'

import type { Payload } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'

import { defineOperation } from '../../operations/defineOperation.js'
import { requestSchema } from '../../operations/schemaFields.js'
import { uploadStagedFile as uploadStagedUpload } from '../stagedUpload.js'

const uploadStagedFileSchema = z.looseObject({ req: requestSchema })

export const uploadStagedFile = defineOperation({
  action: 'uploadStagedFile',
  expose: {
    rest: [
      {
        handler: ({ invoke, req }) =>
          invoke({
            context: req.payload,
            input: { req },
            validate: false,
          }),
        method: 'put',
        path: '/upload-instructions/:uploadId',
        wrapInternal: false,
      },
    ],
  },
  handler: async (_payload: Payload, input: { req: PayloadRequest }) =>
    uploadStagedUpload(input.req),
  input: uploadStagedFileSchema,
  target: 'upload',
})
