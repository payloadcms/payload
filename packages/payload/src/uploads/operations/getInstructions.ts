import { z } from 'zod'

import type { Payload } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { UploadInstructions, UploadInstructionsRequest } from '../types.js'

import { getAccessResults } from '../../auth/getAccessResults.js'
import { APIError, Forbidden } from '../../errors/index.js'
import { defineOperation, invokeOperation } from '../../operations/defineOperation.js'
import { collectionSchema, requestSchema } from '../../operations/schemaFields.js'
import { checkFileRestrictions } from '../checkFileRestrictions.js'
import { generateStagedUploadInstructions } from '../stagedUpload.js'

const bytesToMB = (bytes: number) => bytes / 1024 / 1024

type GetUploadInstructionsInput = {
  overrideAccess?: boolean
  req: PayloadRequest
} & UploadInstructionsRequest

const isUploadInstructionsRequest = (upload: unknown): upload is UploadInstructionsRequest =>
  typeof upload === 'object' &&
  upload !== null &&
  'collectionSlug' in upload &&
  typeof upload.collectionSlug === 'string' &&
  (!('docPrefix' in upload) ||
    upload.docPrefix === undefined ||
    typeof upload.docPrefix === 'string') &&
  'filename' in upload &&
  typeof upload.filename === 'string' &&
  'filesize' in upload &&
  typeof upload.filesize === 'number' &&
  Number.isSafeInteger(upload.filesize) &&
  upload.filesize >= 0 &&
  'mimeType' in upload &&
  typeof upload.mimeType === 'string'

const getUploadInstructionsSchema = z.looseObject({
  collectionSlug: collectionSchema,
  docPrefix: z.string().describe('Optional document folder or prefix').optional(),
  filename: z.string().min(1).describe('The original file name'),
  filesize: z.number().int().nonnegative().describe('The file size in bytes'),
  mimeType: z.string().min(1).describe('The file MIME type'),
  overrideAccess: z.boolean().optional().default(false),
  req: requestSchema,
})

export const getInstructions = defineOperation({
  action: 'getInstructions',
  expose: {
    mcp: { name: 'getUploadInstructions' },
    rest: [
      {
        handler: async ({ invoke, req }) => {
          if (!req.json) {
            throw new APIError('Content-Type expected to be application/json', 400)
          }

          const upload: unknown = await req.json()
          if (!isUploadInstructionsRequest(upload)) {
            throw new APIError('Invalid upload instructions request', 400)
          }

          return Response.json(
            await invoke({
              context: req.payload,
              input: { ...upload, req },
              validate: false,
            }),
          )
        },
        method: 'post',
        path: '/upload-instructions',
        wrapInternal: false,
      },
    ],
  },
  handler: async (
    _payload: Payload,
    { overrideAccess = false, req, ...upload }: GetUploadInstructionsInput,
  ): Promise<UploadInstructions> => {
    const collection = req.payload.collections[upload.collectionSlug]
    const uploadInstructions = collection?.config?.upload?.uploadInstructions

    if (!collection?.config?.upload) {
      throw new APIError(`Upload collection ${upload.collectionSlug} was not found`, 400)
    }

    const filesizeLimit = req.payload.config.upload.limits?.fileSize
    if (filesizeLimit && upload.filesize > filesizeLimit) {
      throw new APIError(
        `Exceeded file size limit. Limit: ${bytesToMB(filesizeLimit).toFixed(2)}MB, got: ${bytesToMB(upload.filesize).toFixed(2)}MB`,
        400,
      )
    }

    await checkFileRestrictions({
      checkFileContents: false,
      collection: collection.config,
      file: {
        name: upload.filename,
        data: Buffer.alloc(0),
        mimetype: upload.mimeType,
        size: upload.filesize,
      },
      req,
    })

    if (!uploadInstructions && !overrideAccess) {
      if (!req.user) {
        throw new Forbidden(req.t)
      }

      const collectionPermissions = (await getAccessResults({ req })).collections?.[
        upload.collectionSlug
      ]

      if (!collectionPermissions?.create && !collectionPermissions?.update) {
        throw new Forbidden(req.t)
      }
    }

    return uploadInstructions
      ? uploadInstructions.generate({ ...upload, overrideAccess, req })
      : generateStagedUploadInstructions({ ...upload, req })
  },
  input: getUploadInstructionsSchema,
  target: 'upload',
})

export const buildUploadInstructions = (
  input: GetUploadInstructionsInput,
): Promise<UploadInstructions> =>
  invokeOperation(getInstructions, {
    context: input.req.payload,
    input,
  })
