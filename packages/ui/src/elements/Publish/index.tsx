'use client'

import qs from 'qs'
import React, { useCallback } from 'react'

import { useForm, useFormModified } from '../../forms/Form/context.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

const DefaultPublishButton: React.FC = () => {
  const { code } = useLocale()
  const { id, collectionSlug, globalSlug, publishedDoc, unpublishedVersions } = useDocumentInfo()
  const [hasPublishPermission, setHasPublishPermission] = React.useState(false)
  const { getData, submit } = useForm()
  const modified = useFormModified()

  const {
    routes: { api },
    serverURL,
  } = useConfig()
  const { t } = useTranslation()
  const label = t('version:publishChanges')

  const hasNewerVersions = unpublishedVersions?.totalDocs > 0
  const canPublish = hasPublishPermission && (modified || hasNewerVersions || !publishedDoc)

  const publish = useCallback(() => {
    void submit({
      overrides: {
        _status: 'published',
      },
    })
  }, [submit])

  React.useEffect(() => {
    const fetchPublishAccess = async () => {
      let docAccessURL: string
      let operation = 'update'

      const params = {
        locale: code || undefined,
      }
      if (globalSlug) {
        docAccessURL = `/globals/${globalSlug}/access`
      } else if (collectionSlug) {
        if (!id) operation = 'create'
        docAccessURL = `/${collectionSlug}/access${id ? `/${id}` : ''}`
      }

      if (docAccessURL) {
        const data = getData()

        const res = await fetch(`${serverURL}${api}${docAccessURL}?${qs.stringify(params)}`, {
          body: JSON.stringify({
            ...data,
            _status: 'published',
          }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'post',
        })
        const json = await res.json()
        const result = Boolean(json?.[operation]?.permission)
        setHasPublishPermission(result)
      } else {
        setHasPublishPermission(true)
      }
    }

    void fetchPublishAccess()
  }, [api, code, collectionSlug, getData, globalSlug, id, serverURL])

  if (!canPublish) return null

  return (
    <FormSubmit
      buttonId="action-save"
      disabled={!canPublish}
      onClick={publish}
      size="small"
      type="button"
    >
      {label}
    </FormSubmit>
  )
}

type Props = {
  CustomComponent?: React.ReactNode
}

export const Publish: React.FC<Props> = ({ CustomComponent }) => {
  if (CustomComponent) return CustomComponent

  return <DefaultPublishButton />
}
