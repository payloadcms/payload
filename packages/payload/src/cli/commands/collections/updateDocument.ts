import path from 'node:path'
import { z } from 'zod'

import type { Payload, PopulateType, SelectType, Where } from '../../../index.js'

import { defineCLICommand } from '../../defineCLICommand.js'
import {
  collectionSlugSchema,
  dataSchema,
  depthSchema,
  fallbackLocaleSchema,
  fileSchema,
  idSchema,
  limitSchema,
  localeSchema,
  overrideLockSchema,
  overwriteExistingFilesSchema,
  parseFallbackLocale,
  parseID,
  parseJSON,
  parseSort,
  populateSchema,
  publishAllLocalesSchema,
  selectSchema,
  showHiddenFieldsSchema,
  sortSchema,
  trashSchema,
  unpublishAllLocalesSchema,
  whereSchema,
  writeDraftSchema,
} from '../data/input.js'
import { prepareCollectionData, printJSON, requireIDOrWhere } from '../data/utilities.js'

const input = z
  .strictObject({
    id: idSchema.optional(),
    slug: collectionSlugSchema,
    data: dataSchema,
    depth: depthSchema,
    draft: writeDraftSchema,
    fallbackLocale: fallbackLocaleSchema,
    file: fileSchema,
    limit: limitSchema,
    locale: localeSchema,
    overrideLock: overrideLockSchema,
    overwriteExistingFiles: overwriteExistingFilesSchema,
    populate: populateSchema,
    publishAllLocales: publishAllLocalesSchema,
    select: selectSchema,
    showHiddenFields: showHiddenFieldsSchema,
    sort: sortSchema,
    trash: trashSchema,
    unpublishAllLocales: unpublishAllLocalesSchema,
    where: whereSchema,
  })
  .superRefine(requireIDOrWhere)

export const createUpdateDocumentCommand = defineCLICommand({
  name: 'updateDocument',
  cli: {
    id: { flags: '--id <id>', parse: parseID },
    data: { flags: '--data <json|@file>', parse: parseJSON },
    fallbackLocale: { flags: '--fallback-locale <locale|false>', parse: parseFallbackLocale },
    populate: { flags: '--populate <json|@file>', parse: parseJSON },
    select: { flags: '--select <json|@file>', parse: parseJSON },
    sort: { flags: '--sort <field>', parse: parseSort },
    where: { flags: '--where <json|@file>', parse: parseJSON },
  },
  description: 'Update documents in a local collection by ID or where query.',
  handler: async ({ args, getPayload }) => {
    const payload = await getPayload()
    const collection = args.slug
    const result = await payload.update({
      id: args.id,
      collection,
      data: prepareCollectionData({ collection, data: args.data, payload }),
      depth: args.depth,
      draft: args.draft,
      fallbackLocale: args.fallbackLocale,
      filePath: args.file ? path.resolve(process.cwd(), args.file) : undefined,
      limit: args.limit,
      locale: args.locale,
      overrideAccess: true,
      overrideLock: args.overrideLock,
      overwriteExistingFiles: args.overwriteExistingFiles,
      populate: args.populate as PopulateType | undefined,
      publishAllLocales: args.publishAllLocales,
      select: args.select as SelectType | undefined,
      showHiddenFields: args.showHiddenFields,
      sort: args.sort,
      trash: args.trash,
      unpublishAllLocales: args.unpublishAllLocales,
      where: args.where as undefined | Where,
    } as Parameters<Payload['update']>[0])

    printJSON(result)
  },
  helpGroup: 'Data commands',
  input,
})
