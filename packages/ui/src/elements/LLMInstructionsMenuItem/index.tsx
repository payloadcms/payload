'use client'

import { formatAdminURL, instructionsCollectionSlug } from 'payload/shared'
import React from 'react'

import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import * as PopupList from '../Popup/PopupButtonList/index.js'

export const LLMInstructionsMenuItem = ({ collectionSlug }: { collectionSlug?: string }) => {
  const { config } = useConfig()
  const { globalSlug } = useDocumentInfo()
  const { t } = useTranslation()
  const id = collectionSlug ? `collection:${collectionSlug}` : `global:${globalSlug}`

  return (
    <React.Fragment>
      <PopupList.Divider />
      <PopupList.Button
        href={formatAdminURL({
          adminRoute: config.routes.admin,
          path: `/collections/${instructionsCollectionSlug}/${encodeURIComponent(id)}`,
        })}
      >
        {t('llmInstructions:editInstructions')}
      </PopupList.Button>
    </React.Fragment>
  )
}
