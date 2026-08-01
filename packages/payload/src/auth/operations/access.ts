import { status as httpStatus } from 'http-status'
import { z } from 'zod'

import type { Payload } from '../../index.js'
import type { PayloadRequest } from '../../types/index.js'
import type { SanitizedPermissions } from '../types.js'

import { defineOperation } from '../../operations/defineOperation.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { adminInit as adminInitTelemetry } from '../../utilities/telemetry/events/adminInit.js'
import { getAccessResults } from '../getAccessResults.js'

type AccessArgs = {
  req: PayloadRequest
}

const getAccess = async (args: AccessArgs): Promise<SanitizedPermissions> => {
  const { req } = args

  adminInitTelemetry(req)

  try {
    return getAccessResults({ req })
  } catch (e: unknown) {
    await killTransaction(req)
    throw e
  }
}

const accessSchema = z.looseObject({ req: z.unknown() })

export const access = defineOperation({
  action: 'access',
  expose: {
    rest: [
      {
        handler: async ({ invoke, req }) => {
          const headers = headersWithCors({ headers: new Headers(), req })

          try {
            const result = await invoke({
              context: req.payload,
              input: { req },
              validate: false,
            })

            return Response.json(result, { headers, status: httpStatus.OK })
          } catch (error: unknown) {
            return Response.json({ error }, { headers, status: httpStatus.INTERNAL_SERVER_ERROR })
          }
        },
        method: 'get',
        path: '/access',
      },
    ],
  },
  handler: (_payload: Payload, input: { req: PayloadRequest }) => getAccess(input),
  input: accessSchema,
  target: 'root',
})
