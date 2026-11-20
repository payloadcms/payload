'use client'
import type { ClientField } from 'payload'

import { flattenTopLevelFields } from 'payload/shared'
import { useCallback, useMemo } from 'react'

import { useConfig } from '../providers/Config/index.js'
import { isDocumentVideoPreviewAllowed } from '../utilities/getDocumentThumbnail.js'

/**
 * Decide per document card whether its video upload may load a frame, from the
 * `displayPreview` options of the collection's `useAsThumbnail` field and upload collections.
 */
export const useCanPreviewDocumentVideo = ({
  collectionSlug,
}: {
  collectionSlug: string
}): ((doc: Record<string, unknown>) => boolean) => {
  const { getEntityConfig } = useConfig()
  const collectionConfig = getEntityConfig({ collectionSlug })
  const useAsThumbnail = collectionConfig?.admin?.useAsThumbnail
  const fields = collectionConfig?.fields

  const thumbnailField = useMemo(
    () => getThumbnailField({ fields: fields ?? [], useAsThumbnail }),
    [fields, useAsThumbnail],
  )

  return useCallback(
    (doc) =>
      isDocumentVideoPreviewAllowed({
        collectionSlug,
        doc,
        getUploadDisplayPreview: (slug) =>
          getEntityConfig({ collectionSlug: slug })?.upload?.displayPreview,
        thumbnailField,
        useAsThumbnail,
      }),
    [collectionSlug, getEntityConfig, thumbnailField, useAsThumbnail],
  )
}

/** Find the upload field that `useAsThumbnail` names, including fields nested in layout fields. */
function getThumbnailField({
  fields,
  useAsThumbnail,
}: {
  fields: ClientField[]
  useAsThumbnail: string | undefined
}): { displayPreview?: boolean; relationTo: string | string[] } | undefined {
  if (!useAsThumbnail) {
    return undefined
  }

  const field = flattenTopLevelFields(fields).find(
    (topLevelField) => 'name' in topLevelField && topLevelField.name === useAsThumbnail,
  )

  if (field?.type !== 'upload') {
    return undefined
  }

  return { displayPreview: field.displayPreview, relationTo: field.relationTo }
}
