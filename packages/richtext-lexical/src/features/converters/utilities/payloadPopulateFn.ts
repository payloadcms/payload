import { createLocalReq, type Payload, type PayloadRequest, type TypedLocale } from 'payload'

import type { HTMLPopulateFn } from '../lexicalToHtml/async/types.js'

import { populate } from '../../../populateGraphQL/populate.js'

export const getPayloadPopulateFn: (
  args: {
    currentDepth: number
    depth: number
    draft?: boolean
    locale?: TypedLocale

    overrideAccess?: boolean
    showHiddenFields?: boolean
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
  draft,
  overrideAccess,
  payload,
  req,
  showHiddenFields,
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
      draft: draft ?? false,
      key: 'value',
      overrideAccess: overrideAccess ?? true,
      req: reqToUse,
      select,
      showHiddenFields: showHiddenFields ?? false,
    })

    return dataContainer.value
  }

  return populateFn
}
