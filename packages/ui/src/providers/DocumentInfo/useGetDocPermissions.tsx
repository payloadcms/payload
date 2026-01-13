import type { Data, SanitizedDocumentPermissions, SanitizedPermissions } from 'payload'

import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'

import { hasSavePermission as getHasSavePermission } from '../../utilities/hasSavePermission.js'
import { isEditing as getIsEditing } from '../../utilities/isEditing.js'

export type GetDocPermissions = (data?: Data) => Promise<void>

export const useGetDocPermissions = ({
  id,
  api,
  collectionSlug,
  globalSlug,
  i18n,
  locale,
  permissions,
  setDocPermissions,
  setHasPublishPermission,
  setHasSavePermission,
}: {
  api: string
  collectionSlug: string
  globalSlug: string
  i18n: any
  id: string
  locale: string
  permissions: SanitizedPermissions
  setDocPermissions: React.Dispatch<React.SetStateAction<SanitizedDocumentPermissions>>
  setHasPublishPermission: React.Dispatch<React.SetStateAction<boolean>>
  setHasSavePermission: React.Dispatch<React.SetStateAction<boolean>>
}): GetDocPermissions =>
  React.useCallback(
    async (data: Data) => {
      const params = {
        locale: locale || undefined,
      }

      const idToUse = data?.id || id
      const newIsEditing = getIsEditing({ id: idToUse, collectionSlug, globalSlug })

      if (newIsEditing) {
        const docAccessPath: `/${string}` = collectionSlug
          ? `/${collectionSlug}/access/${idToUse}`
          : globalSlug
            ? `/globals/${globalSlug}/access`
            : null

        if (docAccessPath) {
          const res = await fetch(
            formatAdminURL({
              apiRoute: api,
              path: `${docAccessPath}${qs.stringify(params, { addQueryPrefix: true })}`,
            }),
            {
              body: JSON.stringify({
                ...(data || {}),
                _status: 'draft',
              }),
              credentials: 'include',
              headers: {
                'Accept-Language': i18n.language,
                'Content-Type': 'application/json',
              },
              method: 'post',
            },
          )

          const json: SanitizedDocumentPermissions = await res.json()

          const publishedAccessJSON = await fetch(
            formatAdminURL({
              apiRoute: api,
              path: `${docAccessPath}${qs.stringify(params, { addQueryPrefix: true })}`,
            }),
            {
              body: JSON.stringify({
                ...(data || {}),
                _status: 'published',
              }),
              credentials: 'include',
              headers: {
                'Accept-Language': i18n.language,
                'Content-Type': 'application/json',
              },
              method: 'POST',
            },
          ).then((res) => res.json())

          setDocPermissions(json)

          setHasSavePermission(
            getHasSavePermission({
              collectionSlug,
              docPermissions: json,
              globalSlug,
              isEditing: newIsEditing,
            }),
          )

          setHasPublishPermission(publishedAccessJSON?.update)
        }
      } else {
        // when creating new documents, there is no permissions saved for this document yet
        // use the generic entity permissions instead
        const newDocPermissions = collectionSlug
          ? permissions?.collections?.[collectionSlug]
          : permissions?.globals?.[globalSlug]

        setDocPermissions(newDocPermissions)

        setHasSavePermission(
          getHasSavePermission({
            collectionSlug,
            docPermissions: newDocPermissions,
            globalSlug,
            isEditing: newIsEditing,
          }),
        )
      }
    },
    [
      locale,
      id,
      collectionSlug,
      globalSlug,
      api,
      i18n.language,
      setDocPermissions,
      setHasSavePermission,
      setHasPublishPermission,
      permissions?.collections,
      permissions?.globals,
    ],
  )
