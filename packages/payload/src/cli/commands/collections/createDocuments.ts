import type { CLICommand } from '../../../config/types.js'
import type { PopulateType, SelectType } from '../../../index.js'

import { createDataCommand } from '../data/createDataCommand.js'
import {
  collectionSlugOption,
  depthOption,
  documentDataOption,
  fallbackLocaleOption,
  falseByDefaultDraftOption,
  filesOption,
  localeOption,
  overwriteExistingFilesOption,
  populateOption,
  publishAllLocalesOption,
  selectOption,
  showHiddenFieldsOption,
} from '../data/options.js'
import { prepareCollectionData, printJSON } from '../data/utilities.js'

export const createCreateDocumentsCommand: CLICommand = (args) =>
  createDataCommand({
    args,
    definition: {
      name: 'createDocuments',
      description: 'Create one or more documents in a local collection.',
      async handler({ options, payload }) {
        const collection = options.slug
        const docs: Array<{ doc: unknown; index: number }> = []
        const errors: Array<{ index: number; message: string }> = []

        for (const [index, data] of options.data.entries()) {
          try {
            const doc = await payload.create({
              collection,
              data: prepareCollectionData({ collection, data, payload }),
              depth: options.depth,
              draft: options.draft,
              fallbackLocale: options.fallbackLocale,
              filePath: options.file?.[index],
              locale: options.locale,
              overrideAccess: true,
              overwriteExistingFiles: options.overwriteExistingFiles,
              populate: options.populate as PopulateType | undefined,
              publishAllLocales: options.publishAllLocales,
              select: options.select as SelectType | undefined,
              showHiddenFields: options.showHiddenFields,
            })

            docs.push({ doc, index })
          } catch (error) {
            errors.push({
              index,
              message: error instanceof Error ? error.message : 'Unknown error',
            })
          }
        }

        printJSON({ docs, errors })
        return errors.length > 0 ? { exitCode: 1 } : {}
      },
      options: {
        slug: collectionSlugOption,
        data: documentDataOption,
        depth: depthOption,
        draft: falseByDefaultDraftOption,
        fallbackLocale: fallbackLocaleOption,
        file: filesOption,
        locale: localeOption,
        overwriteExistingFiles: overwriteExistingFilesOption,
        populate: populateOption,
        publishAllLocales: publishAllLocalesOption,
        select: selectOption,
        showHiddenFields: showHiddenFieldsOption,
      },
      summary: 'Create collection documents',
      superRefine(options, refinementContext) {
        if (options.file?.length && options.file.length !== options.data.length) {
          refinementContext.addIssue({
            code: 'custom',
            message: 'Pass one --file for each document when creating multiple documents.',
            path: ['file'],
          })
        }
      },
    },
  })
