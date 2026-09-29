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
    // Secondary: this drawer exists to pick an existing document, so creating one is the escape
    // hatch rather than the main action - the primary slot belongs to `SelectMany`.
    <DocumentDrawerToggler
      buttonStyle="secondary"
      className={`${baseClass}__create-new-button`}
      key="create-new-button-toggler"
    >
      {t('general:createNew')}
    </DocumentDrawerToggler>
  )
}
