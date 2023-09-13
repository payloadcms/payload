import React, { Fragment } from 'react'

import type { CollectionPermission } from '../../../../auth'
import type { SanitizedCollectionConfig } from '../../../../exports/types'

import { MetaAndActions } from './MetaAndActions'
import { TitleAndTabs } from './TitleAndTabs'

const baseClass = 'doc-header'

export type DocumentHeaderProps = {
  apiURL: string
  collection: SanitizedCollectionConfig
  customHeader?: React.ReactNode
  data?: any
  disableActions?: boolean
  hasSavePermission: boolean
  id: string
  isEditing: boolean
  permissions: CollectionPermission
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = (props) => {
  return (
    <Fragment>
      <TitleAndTabs {...props} baseClass={baseClass} />
      <MetaAndActions {...props} baseClass={baseClass} />
    </Fragment>
  )
}
