/**
 * Shared input schemas for collection data commands.
 *
 * The Payload CLI and MCP plugin use these schemas so they accept and validate the same input.
 * Local variants include trusted options that should only be available to local callers.
 */
import * as z from 'zod/mini'

import {
  dataSchema,
  defaultLimitSchema,
  defaultPageSchema,
  depthSchema,
  draftSchema,
  fallbackLocaleSchema,
  fieldSchema,
  idSchema,
  joinsSchema,
  limitSchema,
  localeSchema,
  overrideAccessSchema,
  overrideLockSchema,
  overwriteExistingFilesSchema,
  pageSchema,
  paginationSchema,
  populateSchema,
  publishAllLocalesSchema,
  requireIDOrWhere,
  requireReturningForSelect,
  returningSchema,
  selectedLocalesSchema,
  selectSchema,
  showHiddenFieldsSchema,
  slugSchema,
  sortSchema,
  trashSchema,
  unpublishAllLocalesSchema,
  whereSchema,
  writeDraftSchema,
} from '../../utilities/sharedInputSchemas.js'
import { strictObject } from '../../utilities/zod.js'

const countDocumentsInputShape = {
  slug: slugSchema,
  locale: localeSchema,
  trash: trashSchema,
  where: whereSchema,
}

export const countDocumentsInputSchema = strictObject(countDocumentsInputShape)

/** For trusted local callers only. Includes access bypass. */
export const countDocumentsLocalInputSchema = strictObject({
  ...countDocumentsInputShape,
  overrideAccess: overrideAccessSchema,
})

const countVersionsInputShape = {
  slug: slugSchema,
  locale: localeSchema,
  where: whereSchema,
}

export const countVersionsInputSchema = strictObject(countVersionsInputShape)

/** For trusted local callers only. Includes access bypass. */
export const countVersionsLocalInputSchema = strictObject({
  ...countVersionsInputShape,
  overrideAccess: overrideAccessSchema,
})

const getCreateDocumentsInputShape = <TFile extends z.core.$ZodType>({
  file,
}: {
  file: TFile
}) => ({
  slug: slugSchema,
  depth: depthSchema,
  documents: z
    .array(
      z.strictObject({
        data: dataSchema,
        file: z.optional(file),
      }),
    )
    .check(z.minLength(1), z.describe('A JSON array of {"data": {...}, "file"?: ...} objects.')),
  draft: writeDraftSchema,
  fallbackLocale: fallbackLocaleSchema,
  locale: localeSchema,
  populate: populateSchema,
  publishAllLocales: publishAllLocalesSchema,
  returning: returningSchema,
  select: selectSchema,
})

/** Safe for remote interfaces. Excludes trusted Local API options. */
export const createDocumentsInputSchema = <TFile extends z.core.$ZodType>({
  file,
}: {
  file: TFile
}) => strictObject(getCreateDocumentsInputShape({ file }), z.superRefine(requireReturningForSelect))

/** For trusted local callers only. Includes access bypass, file overwrites, and hidden fields. */
export const createDocumentsLocalInputSchema = <TFile extends z.core.$ZodType>({
  file,
}: {
  file: TFile
}) =>
  strictObject(
    {
      ...getCreateDocumentsInputShape({ file }),
      overrideAccess: overrideAccessSchema,
      overwriteExistingFiles: overwriteExistingFilesSchema,
      showHiddenFields: showHiddenFieldsSchema,
    },
    z.superRefine(requireReturningForSelect),
  )

const deleteDocumentsInputShape = {
  id: z.optional(idSchema),
  slug: slugSchema,
  depth: depthSchema,
  fallbackLocale: fallbackLocaleSchema,
  locale: localeSchema,
  where: whereSchema,
}

export const deleteDocumentsInputSchema = strictObject(
  deleteDocumentsInputShape,
  z.superRefine(requireIDOrWhere),
)

/** For trusted local callers only. Includes access bypass. */
export const deleteDocumentsLocalInputSchema = strictObject(
  {
    ...deleteDocumentsInputShape,
    overrideAccess: overrideAccessSchema,
  },
  z.superRefine(requireIDOrWhere),
)

const duplicateDocumentInputShape = {
  id: idSchema,
  slug: slugSchema,
  data: z.optional(dataSchema),
  depth: depthSchema,
  draft: writeDraftSchema,
  fallbackLocale: fallbackLocaleSchema,
  locale: localeSchema,
  populate: populateSchema,
  select: selectSchema,
  selectedLocales: selectedLocalesSchema,
}

export const duplicateDocumentInputSchema = strictObject(duplicateDocumentInputShape)

/** For trusted local callers only. Includes access bypass and hidden fields. */
export const duplicateDocumentLocalInputSchema = strictObject({
  ...duplicateDocumentInputShape,
  overrideAccess: overrideAccessSchema,
  showHiddenFields: showHiddenFieldsSchema,
})

const findDistinctInputShape = {
  slug: slugSchema,
  depth: depthSchema,
  field: fieldSchema,
  limit: limitSchema,
  locale: localeSchema,
  page: pageSchema,
  populate: populateSchema,
  sort: sortSchema,
  trash: trashSchema,
  where: whereSchema,
}

export const findDistinctInputSchema = strictObject(findDistinctInputShape)

/** For trusted local callers only. Includes access bypass and hidden fields. */
export const findDistinctLocalInputSchema = strictObject({
  ...findDistinctInputShape,
  overrideAccess: overrideAccessSchema,
  showHiddenFields: showHiddenFieldsSchema,
})

const findDocumentsInputShape = {
  id: z.optional(idSchema),
  slug: slugSchema,
  depth: depthSchema,
  draft: draftSchema,
  fallbackLocale: fallbackLocaleSchema,
  joins: joinsSchema,
  limit: defaultLimitSchema,
  locale: localeSchema,
  page: defaultPageSchema,
  pagination: paginationSchema,
  populate: populateSchema,
  select: selectSchema,
  sort: sortSchema,
  trash: trashSchema,
  where: whereSchema,
}

export const findDocumentsInputSchema = strictObject(findDocumentsInputShape)

/** For trusted local callers only. Includes access bypass and hidden fields. */
export const findDocumentsLocalInputSchema = strictObject({
  ...findDocumentsInputShape,
  overrideAccess: overrideAccessSchema,
  showHiddenFields: showHiddenFieldsSchema,
})

const findVersionByIDInputShape = {
  id: idSchema,
  slug: slugSchema,
  depth: depthSchema,
  draft: draftSchema,
  fallbackLocale: fallbackLocaleSchema,
  locale: localeSchema,
  populate: populateSchema,
  select: selectSchema,
  trash: trashSchema,
}

export const findVersionByIDInputSchema = strictObject(findVersionByIDInputShape)

/** For trusted local callers only. Includes access bypass and hidden fields. */
export const findVersionByIDLocalInputSchema = strictObject({
  ...findVersionByIDInputShape,
  overrideAccess: overrideAccessSchema,
  showHiddenFields: showHiddenFieldsSchema,
})

const findVersionsInputShape = {
  slug: slugSchema,
  depth: depthSchema,
  draft: draftSchema,
  fallbackLocale: fallbackLocaleSchema,
  limit: defaultLimitSchema,
  locale: localeSchema,
  page: defaultPageSchema,
  pagination: paginationSchema,
  populate: populateSchema,
  select: selectSchema,
  sort: sortSchema,
  trash: trashSchema,
  where: whereSchema,
}

export const findVersionsInputSchema = strictObject(findVersionsInputShape)

/** For trusted local callers only. Includes access bypass and hidden fields. */
export const findVersionsLocalInputSchema = strictObject({
  ...findVersionsInputShape,
  overrideAccess: overrideAccessSchema,
  showHiddenFields: showHiddenFieldsSchema,
})

export const getCollectionSchemaInputSchema = strictObject({
  slug: slugSchema,
})

const restoreVersionInputShape = {
  id: idSchema,
  slug: slugSchema,
  depth: depthSchema,
  draft: writeDraftSchema,
  fallbackLocale: fallbackLocaleSchema,
  locale: localeSchema,
  populate: populateSchema,
  select: selectSchema,
}

export const restoreVersionInputSchema = strictObject(restoreVersionInputShape)

/** For trusted local callers only. Includes access bypass and hidden fields. */
export const restoreVersionLocalInputSchema = strictObject({
  ...restoreVersionInputShape,
  overrideAccess: overrideAccessSchema,
  showHiddenFields: showHiddenFieldsSchema,
})

const getUpdateDocumentInputShape = <TFile extends z.core.$ZodType>({ file }: { file: TFile }) => ({
  id: z.optional(idSchema),
  slug: slugSchema,
  data: dataSchema,
  depth: depthSchema,
  draft: writeDraftSchema,
  fallbackLocale: fallbackLocaleSchema,
  file: z.optional(file),
  limit: limitSchema,
  locale: localeSchema,
  overrideLock: overrideLockSchema,
  populate: populateSchema,
  publishAllLocales: publishAllLocalesSchema,
  returning: returningSchema,
  select: selectSchema,
  sort: sortSchema,
  trash: trashSchema,
  unpublishAllLocales: unpublishAllLocalesSchema,
  where: whereSchema,
})

/** Safe for remote interfaces. Excludes trusted Local API options. */
export const updateDocumentInputSchema = <TFile extends z.core.$ZodType>({
  file,
}: {
  file: TFile
}) =>
  strictObject(
    getUpdateDocumentInputShape({ file }),
    z.superRefine(requireIDOrWhere),
    z.superRefine(requireReturningForSelect),
  )

/** For trusted local callers only. Includes access bypass, file overwrites, and hidden fields. */
export const updateDocumentLocalInputSchema = <TFile extends z.core.$ZodType>({
  file,
}: {
  file: TFile
}) =>
  strictObject(
    {
      ...getUpdateDocumentInputShape({ file }),
      overrideAccess: overrideAccessSchema,
      overwriteExistingFiles: overwriteExistingFilesSchema,
      showHiddenFields: showHiddenFieldsSchema,
    },
    z.superRefine(requireIDOrWhere),
    z.superRefine(requireReturningForSelect),
  )
