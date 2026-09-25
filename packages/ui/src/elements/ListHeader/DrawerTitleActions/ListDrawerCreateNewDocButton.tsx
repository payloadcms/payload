'use client'

import { useTranslation } from '../../../providers/Translation/index.js'
import { useListDrawerContext } from '../../ListDrawer/Provider.js'

const baseClass = 'list-header'

type DefaultDrawerTitleActionsProps = {
  hasCreatePermission: boolean
}

export function ListDrawerCreateNewDocButton({
  hasCreatePermission,
}: DefaultDrawerTitleActionsProps) {
  const { DocumentDrawerToggler } = useListDrawerContext()
  const { t } = useTranslation()

  if (!hasCreatePermission) {
    return null
  }

  return (
    <DocumentDrawerToggler
      buttonStyle="primary"
      className={`${baseClass}__create-new-button`}
      key="create-new-button-toggler"
    >
      {t('general:createNew')}
    </DocumentDrawerToggler>
  )
}
