'use client'

import type { MappedComponent } from 'payload'

import React, { useCallback } from 'react'

import { useForm, useFormModified } from '../../forms/Form/context.js'
import { FormSubmit } from '../../forms/Submit/index.js'
import { useHotkey } from '../../hooks/useHotkey.js'
import { RenderComponent } from '../../providers/Config/RenderComponent.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useEditDepth } from '../../providers/EditDepth/index.js'
import { useTranslation } from '../../providers/Translation/index.js'

export const DefaultPublishButton: React.FC<{ label?: string }> = ({ label: labelProp }) => {
  const { hasPublishPermission, publishedDoc, unpublishedVersions } = useDocumentInfo()

  const { submit } = useForm()
  const modified = useFormModified()
  const editDepth = useEditDepth()

  const { t } = useTranslation()
  const label = labelProp || t('version:publishChanges')

  const hasNewerVersions = unpublishedVersions?.totalDocs > 0
  const canPublish = hasPublishPermission && (modified || hasNewerVersions || !publishedDoc)

  useHotkey({ cmdCtrlKey: true, editDepth, keyCodes: ['s'] }, (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (submit) {
      void submit()
    }
  })

  const publish = useCallback(() => {
    void submit({
      overrides: {
        _status: 'published',
      },
    })
  }, [submit])

  if (!hasPublishPermission) return null

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
  CustomComponent?: MappedComponent
}

export const PublishButton: React.FC<Props> = ({ CustomComponent }) => {
  if (CustomComponent) return <RenderComponent mappedComponent={CustomComponent} />
  return <DefaultPublishButton />
}
