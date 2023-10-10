import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig } from '../../../../../collections/config/types'
import type { SanitizedGlobalConfig } from '../../../../../exports/types'
import type { StepNavItem } from '../../../elements/StepNav/types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import useTitle from '../../../../hooks/useTitle'
import { useStepNav } from '../../../elements/StepNav'
import { useConfig } from '../../../utilities/Config'

export const SetStepNav: React.FC<
  | {
      collection: SanitizedCollectionConfig
      id: number | string
      isEditing: boolean
    }
  | {
      global: SanitizedGlobalConfig
    }
> = (props) => {
  let collection: SanitizedCollectionConfig | undefined
  let global: SanitizedGlobalConfig | undefined

  let useAsTitle: string | undefined
  let pluralLabel: SanitizedCollectionConfig['labels']['plural']
  let slug: string
  let isEditing = false
  let id: number | string | undefined

  if ('collection' in props) {
    const {
      id: idFromProps,
      collection: collectionFromProps,
      isEditing: isEditingFromProps,
    } = props
    collection = collectionFromProps
    useAsTitle = collection.admin.useAsTitle
    pluralLabel = collection.labels.plural
    slug = collection.slug
    isEditing = isEditingFromProps
    id = idFromProps
  }

  if ('global' in props) {
    const { global: globalFromProps } = props
    global = globalFromProps
    slug = globalFromProps?.slug
  }

  const title = useTitle({ collection, global })

  const { setStepNav } = useStepNav()

  const { i18n, t } = useTranslation('general')

  const {
    routes: { admin },
  } = useConfig()

  useEffect(() => {
    const nav: StepNavItem[] = []

    if (collection) {
      nav.push({
        label: getTranslation(pluralLabel, i18n),
        url: `${admin}/collections/${slug}`,
      })

      if (isEditing) {
        nav.push({
          label: useAsTitle && useAsTitle !== 'id' ? title || `[${t('untitled')}]` : `${id}`,
        })
      } else {
        nav.push({
          label: t('createNew'),
        })
      }
    } else if (global) {
      nav.push({
        label: title,
        url: `${admin}/globals/${slug}`,
      })
    }

    setStepNav(nav)
  }, [
    setStepNav,
    isEditing,
    pluralLabel,
    id,
    slug,
    useAsTitle,
    admin,
    t,
    i18n,
    title,
    global,
    collection,
  ])

  return null
}
