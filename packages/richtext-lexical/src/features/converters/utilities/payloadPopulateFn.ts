import {
  createLocalReq,
  type Payload,
  type PayloadRequest,
  type ReadVersion,
  type TypedLocale,
} from 'payload'

import type { HTMLPopulateFn } from '../lexicalToHtml/async/types.js'

import { populate } from '../../../populateGraphQL/populate.js'

export const getPayloadPopulateFn: (
  args: {
    currentDepth: number
    depth: number
    locale?: TypedLocale

    overrideAccess?: boolean
    showHiddenFields?: boolean
    version?: ReadVersion
  } & (
    | {
        /**
         * This payload property will only be used if req is undefined. If localization is enabled, you must pass `req` instead.
         */
        payload: Payload
        /**
         * When the converter is called, req CAN be passed in depending on where it's run.
         * If this is undefined and config is passed through, lexical will create a new req object for you.
         */
        req?: never
      }
    | {
        /**
         * This payload property will only be used if req is undefined. If localization is enabled, you must pass `req` instead.
         */
        payload?: never
        /**
         * When the converter is called, req CAN be passed in depending on where it's run.
         * If this is undefined and config is passed through, lexical will create a new req object for you.
         */
        req: PayloadRequest
      }
  ),
) => Promise<HTMLPopulateFn> = async ({
  currentDepth,
  depth,
  overrideAccess,
  payload,
  req,
  showHiddenFields,
  version,
}) => {
  let reqToUse: PayloadRequest | undefined = req
  if (req === undefined && payload) {
    reqToUse = await createLocalReq({}, payload)
  }

  if (!reqToUse) {
    throw new Error('No req or payload provided')
  }

  const populateFn: HTMLPopulateFn = async ({ id, collectionSlug, select }) => {
    const dataContainer: {
      value?: any
    } = {}

    await populate({
      id,
      collectionSlug,
      currentDepth,
      data: dataContainer,
      depth,
      key: 'value',
      overrideAccess: overrideAccess ?? true,
      req: reqToUse,
      select,
      showHiddenFields: showHiddenFields ?? false,
      version,
    })

    return dataContainer.value
  }

  return populateFn
}
