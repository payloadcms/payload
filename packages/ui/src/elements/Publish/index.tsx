'use client'
import qs from 'qs'
import React, { useCallback } from 'react'
import { useTranslation } from '../../providers/Translation'

import { useForm, useFormModified } from '../../forms/Form/context'
import FormSubmit from '../../forms/Submit'
import { useConfig } from '../../providers/Config'
import { useDocumentInfo } from '../../providers/DocumentInfo'
import { useLocale } from '../../providers/Locale'
import { RenderCustomComponent } from '../../elements/RenderCustomComponent'
import { CustomPublishButtonProps, DefaultPublishButtonProps } from 'payload/types'

const DefaultPublishButton: React.FC<DefaultPublishButtonProps> = ({
  id,
  canPublish,
  disabled,
  label,
  publish,
}) => {
  if (!canPublish) return null

  return (
    <FormSubmit buttonId={id} disabled={disabled} onClick={publish} size="small" type="button">
      {label}
    </FormSubmit>
  )
}

type Props = {
  CustomComponent?: CustomPublishButtonProps
}

export const Publish: React.FC<Props> = ({ CustomComponent }) => {
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

  const hasNewerVersions = unpublishedVersions?.totalDocs > 0
  const canPublish = modified || hasNewerVersions || !publishedDoc

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

  return (
    <RenderCustomComponent
      CustomComponent={CustomComponent}
      DefaultComponent={DefaultPublishButton}
      componentProps={{
        id: 'action-save',
        DefaultButton: DefaultPublishButton,
        canPublish: hasPublishPermission,
        disabled: !canPublish,
        label: t('version:publishChanges'),
        publish,
      }}
    />
  )
}
