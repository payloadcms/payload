'use client'

import React, { useCallback } from 'react'

import { useForm, useFormModified } from '../../forms/Form/context.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

export const DefaultPublishButton: React.FC<{ label?: string }> = ({ label: labelProp }) => {
  const { hasSavePermission, publishedDoc, unpublishedVersions } = useDocumentInfo()

  const { submit } = useForm()
  const modified = useFormModified()

  const { t } = useTranslation()
  const label = labelProp || t('version:publishChanges')

  const hasNewerVersions = unpublishedVersions?.totalDocs > 0
  const canPublish = hasSavePermission && (modified || hasNewerVersions || !publishedDoc)

  const publish = useCallback(() => {
    void submit({
      overrides: {
        _status: 'published',
      },
    })
  }, [submit])

  if (!hasSavePermission) return null

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
