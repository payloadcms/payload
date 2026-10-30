import type { Data, SanitizedDocumentPermissions, SanitizedPermissions } from 'payload'

import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'

import { hasSavePermission as getHasSavePermission } from '../../utilities/hasSavePermission.js'
import { isEditing as getIsEditing } from '../../utilities/isEditing.js'

export type GetDocPermissions = (data?: Data, isCurrentRequest?: () => boolean) => Promise<void>

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
}): GetDocPermissions => {
  const { activateRequestScope, getDocPermissions } = React.useMemo(() => {
    const requestScope = {
      isActive: true,
      latestRequest: null as null | symbol,
    }
    const getDocPermissions: GetDocPermissions = async (data, isCurrentRequest) => {
      const request = Symbol()

      requestScope.latestRequest = request

      if (!requestScope.isActive) {
        // Strict Mode replays descendant layout effects before reactivating this scope.
        await Promise.resolve()
      }

      if (!requestScope.isActive || requestScope.latestRequest !== request) {
        return
      }

      const isCurrent = () =>
        requestScope.isActive &&
        requestScope.latestRequest === request &&
        isCurrentRequest?.() !== false

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
                ...(data?.doc || data || {}),
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
                ...(data?.doc || data || {}),
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

          if (!isCurrent()) {
            return
          }

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

        if (!isCurrent()) {
          return
        }

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
    }

    const activateRequestScope = () => {
      requestScope.isActive = true

      return () => {
        requestScope.isActive = false
        requestScope.latestRequest = null
      }
    }

    return { activateRequestScope, getDocPermissions }
  }, [
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
  ])

  React.useLayoutEffect(activateRequestScope, [activateRequestScope])

  return getDocPermissions
}
