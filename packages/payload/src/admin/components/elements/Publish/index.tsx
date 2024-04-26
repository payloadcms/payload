import qs from 'qs'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { useForm, useFormModified } from '../../forms/Form/context'
import FormSubmit from '../../forms/Submit'
import { useConfig } from '../../utilities/Config'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import { useLocale } from '../../utilities/Locale'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'

export type CustomPublishButtonType = React.ComponentType<
  DefaultPublishButtonProps & {
    DefaultButton: React.ComponentType<DefaultPublishButtonProps>
  }
>
/**
 * @deprecated Use `CustomPublishButtonType` instead - renamed from `CustomPublishButtonProps`
 */
export type CustomPublishButtonProps = CustomPublishButtonType

export type DefaultPublishButtonProps = {
  canPublish: boolean
  disabled: boolean
  id?: string
  label: string
  publish: () => void
}
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
  CustomComponent?: CustomPublishButtonType
}

export const Publish: React.FC<Props> = ({ CustomComponent }) => {
  const { code } = useLocale()
  const { id, collection, global, publishedDoc, unpublishedVersions } = useDocumentInfo()
  const [hasPublishPermission, setHasPublishPermission] = React.useState(false)
  const { getData, submit } = useForm()
  const modified = useFormModified()
  const {
    routes: { api },
    serverURL,
  } = useConfig()
  const { t } = useTranslation('version')

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
      if (global) {
        docAccessURL = `/globals/${global.slug}/access`
      } else if (collection) {
        if (!id) operation = 'create'
        docAccessURL = `/${collection.slug}/access${id ? `/${id}` : ''}`
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
  }, [api, code, collection, getData, global, id, serverURL])

  return (
    <RenderCustomComponent
      CustomComponent={CustomComponent}
      DefaultComponent={DefaultPublishButton}
      componentProps={{
        id: 'action-save',
        DefaultButton: DefaultPublishButton,
        canPublish: hasPublishPermission,
        disabled: !canPublish,
        label: t('publishChanges'),
        publish,
      }}
    />
  )
}
