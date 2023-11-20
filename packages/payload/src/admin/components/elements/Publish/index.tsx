import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { useForm, useFormModified } from '../../forms/Form/context'
import FormSubmit from '../../forms/Submit'
import { useDocumentInfo } from '../../utilities/DocumentInfo'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'

export type CustomPublishButtonProps = React.ComponentType<
  DefaultPublishButtonProps & {
    DefaultButton: React.ComponentType<DefaultPublishButtonProps>
  }
>
export type DefaultPublishButtonProps = {
  disabled: boolean
  id?: string
  label: string
  publish: () => void
}
const DefaultPublishButton: React.FC<DefaultPublishButtonProps> = ({
  id,
  disabled,
  label,
  publish,
}) => {
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
  const { publishedDoc, unpublishedVersions } = useDocumentInfo()
  const { submit } = useForm()
  const modified = useFormModified()
  const { t } = useTranslation('version')

  const hasNewerVersions = unpublishedVersions?.totalDocs > 0
  const canPublish = modified || hasNewerVersions || !publishedDoc

  // TODO: call endpoint to set hasPublishPermission
  const DefaultComponent = hasPublishPermission ? DefaultPublishButton : null

  const publish = useCallback(() => {
    void submit({
      overrides: {
        _status: 'published',
      },
    })
  }, [submit])

  return (
    <RenderCustomComponent
      CustomComponent={CustomComponent}
      DefaultComponent={DefaultComponent}
      componentProps={{
        id: 'action-save',
        DefaultButton: DefaultPublishButton,
        disabled: !canPublish,
        label: t('publishChanges'),
        publish,
      }}
    />
  )
}
