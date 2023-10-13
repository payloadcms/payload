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
  const view: string | undefined = props?.view || undefined

  if ('collection' in props) {
    const {
      id: idFromProps,
      collection: collectionFromProps,
      isEditing: isEditingFromProps,
    } = props

    if (collectionFromProps) {
      collection = collectionFromProps
      useAsTitle = collection.admin.useAsTitle
      pluralLabel = collection.labels.plural
      slug = collection.slug
      isEditing = isEditingFromProps
      id = idFromProps
    }
  }

  if ('global' in props) {
    const { global: globalFromProps } = props
    if (globalFromProps) {
      global = globalFromProps
      slug = globalFromProps?.slug
    }
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
        url: `${admin}/collections/${slug}`,
      })

      if (isEditing) {
        nav.push({
          label: (useAsTitle && useAsTitle !== 'id' && title) || `${id}`,
          url: `${admin}/collections/${slug}/${id}`,
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
    drawerDepth,
  ])

  return null
}
