import type { PopulateType, SelectType } from '../../../index.js'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'
import {
  dataSchema,
  depthSchema,
  fallbackLocaleSchema,
  globalSlugSchema,
  localeSchema,
  overrideLockSchema,
  parseFallbackLocale,
  parseJSON,
  populateSchema,
  publishAllLocalesSchema,
  selectSchema,
  showHiddenFieldsSchema,
  unpublishAllLocalesSchema,
  writeDraftSchema,
} from '../data/input.js'
import { prepareGlobalData, printJSON } from '../data/utilities.js'

export const createUpdateGlobalCommand = defineCLICommand({
  cli: {
    data: { flags: '--data <json|@file>', parse: parseJSON },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
  },
  description: 'Update a local global.',
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload()
    const slug = args.slug
    const result = await payload.updateGlobal({
      slug,
      data: prepareGlobalData({ slug, data: args.data, payload }),
      depth: args.depth,
      draft: args.draft,
      fallbackLocale: args.fallbackLocale,
      locale: args.locale,
      overrideAccess: true,
      overrideLock: args.overrideLock,
      populate: args.populate as PopulateType | undefined,
      publishAllLocales: args.publishAllLocales,
      select: args.select as SelectType | undefined,
      showHiddenFields: args.showHiddenFields,
      unpublishAllLocales: args.unpublishAllLocales,
    })

    if (!isJSON) {
      printJSON(result)
    }

    return { result }
  },
  helpGroup: 'Data commands',
  input: strictObject({
    slug: globalSlugSchema,
    data: dataSchema,
    depth: depthSchema,
    draft: writeDraftSchema,
    fallbackLocale: fallbackLocaleSchema,
    locale: localeSchema,
    overrideLock: overrideLockSchema,
    populate: populateSchema,
    publishAllLocales: publishAllLocalesSchema,
    select: selectSchema,
    showHiddenFields: showHiddenFieldsSchema,
    unpublishAllLocales: unpublishAllLocalesSchema,
  }),
})
