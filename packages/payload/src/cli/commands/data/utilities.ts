/* eslint-disable no-console */
import type { z } from 'zod'

import type {
  CollectionSlug,
  GlobalSlug,
  Payload,
  PopulateType,
  SelectType,
} from '../../../index.js'

import {
  getCollectionVirtualFieldNames,
  getGlobalVirtualFieldNames,
  stripVirtualFields,
} from '../../../utilities/getVirtualFieldNames.js'
import { transformPointDataToPayload } from '../../../utilities/transformPointDataToPayload.js'

export const requireIDOrWhere = (
  options: { id?: number | string; where?: unknown },
  context: z.core.$RefinementCtx,
): void => {
  if (options.id === undefined && !options.where) {
    context.addIssue({
      code: 'custom',
      message: 'Either --id or --where must be provided.',
      path: ['id'],
    })
  }
}

export const getReadOptions = (options: {
  depth: number
  fallbackLocale?: false | string
  locale?: string
  populate?: Record<string, unknown>
  select?: Record<string, unknown>
  showHiddenFields?: boolean
}) => ({
  depth: options.depth,
  fallbackLocale: options.fallbackLocale,
  locale: options.locale,
  overrideAccess: true as const,
  populate: options.populate as PopulateType | undefined,
  select: options.select as SelectType | undefined,
  showHiddenFields: options.showHiddenFields,
})

export const prepareCollectionData = ({
  collection,
  data,
  payload,
}: {
  collection: CollectionSlug
  data: Record<string, unknown>
  payload: Payload
}): Record<string, unknown> =>
  transformPointDataToPayload(
    stripVirtualFields(data, getCollectionVirtualFieldNames(payload.config, collection)),
  )

export const prepareGlobalData = ({
  slug,
  data,
  payload,
}: {
  data: Record<string, unknown>
  payload: Payload
  slug: GlobalSlug
}): Record<string, unknown> =>
  transformPointDataToPayload(
    stripVirtualFields(data, getGlobalVirtualFieldNames(payload.config, slug)),
  )

export const printJSON = (value: unknown): void => {
  console.log(
    JSON.stringify(value, (_key, item) => (typeof item === 'bigint' ? item.toString() : item), 2),
  )
}
