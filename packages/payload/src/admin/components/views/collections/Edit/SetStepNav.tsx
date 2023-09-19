import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig } from '../../../../../collections/config/types'
import type { StepNavItem } from '../../../elements/StepNav/types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import useTitle from '../../../../hooks/useTitle'
import { useStepNav } from '../../../elements/StepNav'
import { useConfig } from '../../../utilities/Config'

export const SetStepNav: React.FC<{
  collection: SanitizedCollectionConfig
  id: string
  isEditing: boolean
}> = ({ id, collection, isEditing }) => {
  const {
    admin: { useAsTitle },
    labels: { plural: pluralLabel },
    slug,
  } = collection

  const { setStepNav } = useStepNav()
  const { i18n, t } = useTranslation('general')
  const {
    routes: { admin },
  } = useConfig()

  const title = useTitle(collection)

  useEffect(() => {
    const nav: StepNavItem[] = [
      {
        label: getTranslation(pluralLabel, i18n),
        url: `${admin}/collections/${slug}`,
      },
    ]

    if (isEditing) {
      nav.push({
        label: useAsTitle && useAsTitle !== 'id' ? title || `[${t('untitled')}]` : id,
      })
    } else {
      nav.push({
        label: t('createNew'),
      })
    }

    setStepNav(nav)
  }, [setStepNav, isEditing, pluralLabel, id, slug, useAsTitle, admin, t, i18n, title])

  return null
}
