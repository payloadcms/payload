import type { Data, SanitizedDocumentPermissions, SanitizedPermissions } from 'payload'

import * as qs from 'qs-esm'
import React from 'react'

import { hasSavePermission as getHasSavePermission } from '../../utilities/hasSavePermission.js'
import { isEditing as getIsEditing } from '../../utilities/isEditing.js'

export const useGetDocPermissions = ({
  id,
  api,
  collectionSlug,
  globalSlug,
  i18n,
  locale,
  permissions,
  serverURL,
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
  serverURL: string
  setDocPermissions: React.Dispatch<React.SetStateAction<SanitizedDocumentPermissions>>
  setHasPublishPermission: React.Dispatch<React.SetStateAction<boolean>>
  setHasSavePermission: React.Dispatch<React.SetStateAction<boolean>>
}) =>
  React.useCallback(
    async (data: Data) => {
      const params = {
        locale: locale || undefined,
      }

      const idToUse = data?.id || id
      const newIsEditing = getIsEditing({ id: idToUse, collectionSlug, globalSlug })

      if (newIsEditing) {
        const docAccessURL = collectionSlug
          ? `/${collectionSlug}/access/${idToUse}`
          : globalSlug
            ? `/globals/${globalSlug}/access`
            : null

        if (docAccessURL) {
          const res = await fetch(`${serverURL}${api}${docAccessURL}?${qs.stringify(params)}`, {
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
          })

          const json: SanitizedDocumentPermissions = await res.json()

          const publishedAccessJSON = await fetch(
            `${serverURL}${api}${docAccessURL}?${qs.stringify(params)}`,
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
    [serverURL, api, id, permissions, i18n.language, locale, collectionSlug, globalSlug],
  )
