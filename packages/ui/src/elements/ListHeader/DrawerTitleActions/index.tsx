'use client'

import type { TFunction } from '@payloadcms/translations'

import { useListDrawerContext } from '../../ListDrawer/Provider.js'
import { Pill } from '../../Pill/index.js'

const baseClass = 'list-header'

type DefaultDrawerTitleActionsProps = {
  hasCreatePermission: boolean
  t: TFunction
}

export const DefaultDrawerTitleActions = ({
  hasCreatePermission,
  t,
}: DefaultDrawerTitleActionsProps): React.ReactNode[] => {
  const Actions: React.ReactNode[] = []

  const { DocumentDrawerToggler } = useListDrawerContext()

  if (hasCreatePermission) {
    Actions.push(
      <DocumentDrawerToggler
        className={`${baseClass}__create-new-button`}
        key="create-new-button-toggler"
      >
        <Pill>{t('general:createNew')}</Pill>
      </DocumentDrawerToggler>,
    )
  }

  return Actions
}
