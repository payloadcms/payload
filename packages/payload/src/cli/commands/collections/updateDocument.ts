import type { CLICommand } from '../../../config/types.js'
import type { Payload, PopulateType, SelectType, Where } from '../../../index.js'

import { createDataCommand } from '../data/createDataCommand.js'
import {
  collectionSlugOption,
  depthOption,
  fallbackLocaleOption,
  falseByDefaultDraftOption,
  fileOption,
  localeOption,
  optionalIDOption,
  optionalLimitOption,
  overrideLockOption,
  overwriteExistingFilesOption,
  populateOption,
  publishAllLocalesOption,
  requiredDataOption,
  selectOption,
  showHiddenFieldsOption,
  sortOption,
  trashOption,
  unpublishAllLocalesOption,
  whereOption,
} from '../data/options.js'
import { prepareCollectionData, printJSON, requireIDOrWhere } from '../data/utilities.js'

export const createUpdateDocumentCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'updateDocument',
      description: 'Update documents in a local collection by ID or where query.',
      async handler({ options, payload }) {
        const collection = options.slug
        const result = await payload.update({
          id: options.id,
          collection,
          data: prepareCollectionData({ collection, data: options.data, payload }),
          depth: options.depth,
          draft: options.draft,
          fallbackLocale: options.fallbackLocale,
          filePath: options.file,
          limit: options.limit,
          locale: options.locale,
          overrideAccess: true,
          overrideLock: options.overrideLock,
          overwriteExistingFiles: options.overwriteExistingFiles,
          populate: options.populate as PopulateType | undefined,
          publishAllLocales: options.publishAllLocales,
          select: options.select as SelectType | undefined,
          showHiddenFields: options.showHiddenFields,
          sort: options.sort,
          trash: options.trash,
          unpublishAllLocales: options.unpublishAllLocales,
          where: options.where as undefined | Where,
        } as Parameters<Payload['update']>[0])

        printJSON(result)
        return {}
      },
      options: {
        id: optionalIDOption,
        slug: collectionSlugOption,
        data: requiredDataOption,
        depth: depthOption,
        draft: falseByDefaultDraftOption,
        fallbackLocale: fallbackLocaleOption,
        file: fileOption,
        limit: optionalLimitOption,
        locale: localeOption,
        overrideLock: overrideLockOption,
        overwriteExistingFiles: overwriteExistingFilesOption,
        populate: populateOption,
        publishAllLocales: publishAllLocalesOption,
        select: selectOption,
        showHiddenFields: showHiddenFieldsOption,
        sort: sortOption,
        trash: trashOption,
        unpublishAllLocales: unpublishAllLocalesOption,
        where: whereOption,
      },
      summary: 'Update collection documents',
      superRefine: requireIDOrWhere,
    },
  })
