import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type { SanitizedCollectionConfig } from '../../../../../collections/config/types'
import type { SanitizedGlobalConfig } from '../../../../../exports/types'
import type { StepNavItem } from '../../../elements/StepNav/types'

import { getTranslation } from '../../../../../utilities/getTranslation'
import useTitle from '../../../../hooks/useTitle'
import { useStepNav } from '../../../elements/StepNav'
import { useConfig } from '../../../utilities/Config'
import { useEditDepth } from '../../../utilities/EditDepth'

export const SetStepNav: React.FC<
  | {
      collection: SanitizedCollectionConfig
      id: number | string
      isEditing: boolean
      view?: string
    }
  | {
      global: SanitizedGlobalConfig
      view?: string
    }
> = (props) => {
  let collection: SanitizedCollectionConfig | undefined
  let global: SanitizedGlobalConfig | undefined

  let useAsTitle: string | undefined
  let pluralLabel: SanitizedCollectionConfig['labels']['plural']
  let slug: string
  let isEditing = false
  let id: number | string | undefined
  let view: string | undefined

  if ('collection' in props) {
    const {
      id: idFromProps,
      collection: collectionFromProps,
      isEditing: isEditingFromProps,
      view: viewFromProps,
    } = props

    if (collectionFromProps) {
      collection = collectionFromProps
      useAsTitle = collection.admin.useAsTitle
      pluralLabel = collection.labels.plural
      slug = collection.slug
      isEditing = isEditingFromProps
      id = idFromProps
      view = viewFromProps
    }
  }

  if ('global' in props) {
    const { global: globalFromProps, view: viewFromProps } = props
    global = globalFromProps
    slug = globalFromProps?.slug
    view = viewFromProps
  }

  const title = useTitle({ collection, global })

  const { setStepNav } = useStepNav()

  const { i18n, t } = useTranslation('general')

  const {
    routes: { admin },
  } = useConfig()

  const drawerDepth = useEditDepth()

  useEffect(() => {
    const nav: StepNavItem[] = []

    if (collection) {
      nav.push({
        label: getTranslation(pluralLabel, i18n),
        url: `${admin}/collections/${slug || collection.slug}`,
      })

      if (isEditing) {
        nav.push({
          label: (useAsTitle && useAsTitle !== 'id' && title) || `${id}`,
          url: `${admin}/collections/${slug || collection.slug}/${id}`,
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

    if (view) {
      nav.push({
        label: view,
      })
    }

    if (drawerDepth <= 1) setStepNav(nav)
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
    view,
  ])

  return null
}
