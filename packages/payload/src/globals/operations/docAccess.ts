import { z } from 'zod'

import type { SanitizedGlobalPermission } from '../../auth/index.js'
import type { Payload } from '../../index.js'
import type { AllOperations, JsonObject, PayloadRequest } from '../../types/index.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import { defineOperation } from '../../operations/defineOperation.js'
import { getEntityPermissions } from '../../utilities/getEntityPermissions/getEntityPermissions.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizePermissions } from '../../utilities/sanitizePermissions.js'

type GlobalAccessArgs = {
  /**
   * If the document data is passed, it will be used to check access instead of fetching the document from the database.
   */
  data?: JsonObject
  globalConfig: SanitizedGlobalConfig
  req: PayloadRequest
}

const getGlobalAccess = async (args: GlobalAccessArgs): Promise<SanitizedGlobalPermission> => {
  const { data, globalConfig, req } = args

  const globalOperations: AllOperations[] = ['read', 'update']

  if (globalConfig.versions) {
    globalOperations.push('readVersions')
  }

  try {
    const result = await getEntityPermissions({
      id: undefined,
      blockReferencesPermissions: {},
      data,
      entity: globalConfig,
      entityType: 'global',
      fetchData: true,
      operations: globalOperations,
      req,
    })

    const sanitizedPermissions = sanitizePermissions({
      globals: {
        [globalConfig.slug]: result,
      },
    })

    const globalPermissions = sanitizedPermissions?.globals?.[globalConfig.slug]
    return globalPermissions ?? { fields: {} }
  } catch (e: unknown) {
    await killTransaction(req)
    throw e
  }
}

const docAccessSchema = z.looseObject({
  data: z.record(z.string(), z.unknown()).optional(),
  global: z.string().describe('The global slug'),
  req: z.unknown(),
})

export const docAccess = defineOperation({
  action: 'docAccess',
  expose: {
    rest: [
      {
        method: 'post',
        path: '/access',
      },
    ],
  },
  handler: async (
    payload: Payload,
    input: { data?: Record<string, unknown>; global: string; req: PayloadRequest },
  ) => {
    const globalConfig = payload.config.globals.find(({ slug }) => slug === input.global)!

    return getGlobalAccess({ data: input.data, globalConfig, req: input.req })
  },
  input: docAccessSchema,
  target: 'global',
})
