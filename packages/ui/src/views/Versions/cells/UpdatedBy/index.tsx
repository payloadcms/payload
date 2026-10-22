'use client'
import { formatAdminURL } from 'payload/shared'
import React, { useEffect, useRef, useState } from 'react'

import { useIntersect } from '../../../../hooks/useIntersect.js'
import { useConfig } from '../../../../providers/Config/index.js'
import { useTranslation } from '../../../../providers/Translation/index.js'
import { canUseDOM } from '../../../../utilities/canUseDOM.js'
import { formatDocTitle } from '../../../../utilities/formatDocTitle/index.js'

type UpdatedByValue = { relationTo: string; value: number | string } | null | undefined

export function UpdatedByCell({ updatedBy }: { updatedBy: UpdatedByValue }) {
  const {
    config: {
      admin: { dateFormat },
      collections,
      routes: { api },
    },
  } = useConfig()
  const { i18n, t } = useTranslation()
  const [intersectionRef, entry] = useIntersect()
  const [label, setLabel] = useState<false | null | string>(null)
  const requestedRef = useRef(false)

  const isVisible = canUseDOM ? entry?.boundingClientRect?.top < window.innerHeight : false

  useEffect(() => {
    if (!updatedBy || requestedRef.current || !isVisible) {
      return
    }

    requestedRef.current = true

    const { relationTo, value } = updatedBy
    const collection = collections.find((c) => c.slug === relationTo)

    if (!collection) {
      setLabel(false)
      return
    }

    const fieldToSelect = collection.admin.useAsTitle ?? 'id'
    const url = formatAdminURL({ apiRoute: api, path: `/${relationTo}/${value}` })
    const params = new URLSearchParams()
    params.append('depth', '0')
    params.append('select[' + fieldToSelect + ']', 'true')

    fetch(`${url}?${params.toString()}`, {
      credentials: 'include',
      headers: { 'Accept-Language': i18n.language },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc) => {
        if (doc) {
          const title = formatDocTitle({
            collectionConfig: collection,
            data: doc,
            dateFormat,
            fallback: `ID: ${value}`,
            i18n,
          })
          setLabel(title)
        } else {
          setLabel(false)
        }
      })
      .catch(() => setLabel(false))
  }, [updatedBy, isVisible, api, collections, dateFormat, i18n, t])

  if (!updatedBy) {
    return <span ref={intersectionRef}>—</span>
  }

  return (
    <span ref={intersectionRef}>
      {label === null && `${t('general:loading')}...`}
      {label === false && `${t('general:untitled')} - ID: ${updatedBy.value}`}
      {label && label}
    </span>
  )
}
