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
  context: 'bulkUpload' | 'create' | 'edit'
  id: string
}> = ({ collection, context, id }) => {
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

    switch (context) {
      case 'create':
        nav.push({
          label: t('createNew'),
        })
        break
      case 'edit':
        nav.push({
          label: useAsTitle && useAsTitle !== 'id' ? title || `[${t('untitled')}]` : id,
        })
        break
      case 'bulkUpload':
        // TODO: translate bulk upload
        nav.push({
          label: 'Bulk Upload',
        })
        break
      default:
        break
    }

    setStepNav(nav)
  }, [setStepNav, context, pluralLabel, id, slug, useAsTitle, admin, t, i18n, title])

  return null
}
