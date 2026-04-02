import type {
  ClientConfig,
  LabelFunction,
  SanitizedPermissions,
  StaticLabel,
  VisibleEntities,
} from 'payload'

import { getTranslation, type I18nClient } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'

export type DashboardEntityLink = {
  href: string
  label: string
  slug: string
  type: 'collection' | 'global'
}

type BuildDashboardEntityLinksArgs = {
  clientConfig: Pick<ClientConfig, 'collections' | 'globals' | 'routes'>
  i18n: I18nClient
  permissions: SanitizedPermissions
  visibleEntities: VisibleEntities
}

const getLabel = ({ i18n, label }: { i18n: I18nClient; label?: LabelFunction | StaticLabel }) => {
  if (!label) {
    return ''
  }

  const resolvedLabel = typeof label === 'function' ? label({ i18n, t: i18n.t }) : label

  return getTranslation(resolvedLabel, i18n)
}

export const buildDashboardEntityLinks = ({
  clientConfig,
  i18n,
  permissions,
  visibleEntities,
}: BuildDashboardEntityLinksArgs): DashboardEntityLink[] => {
  const collectionLinks = clientConfig.collections
    .filter((collection) => visibleEntities.collections.includes(collection.slug))
    .filter((collection) => permissions.collections?.[collection.slug]?.read)
    .map((collection) => ({
      slug: collection.slug,
      type: 'collection' as const,
      href: formatAdminURL({
        adminRoute: clientConfig.routes.admin,
        path: `/collections/${collection.slug}`,
      }),
      label: getLabel({
        i18n,
        label: collection.labels.plural,
      }),
    }))

  const globalLinks = clientConfig.globals
    .filter((global) => visibleEntities.globals.includes(global.slug))
    .filter((global) => permissions.globals?.[global.slug]?.read)
    .map((global) => ({
      slug: global.slug,
      type: 'global' as const,
      href: formatAdminURL({
        adminRoute: clientConfig.routes.admin,
        path: `/globals/${global.slug}`,
      }),
      label: getLabel({
        i18n,
        label: global.label,
      }),
    }))

  return [...collectionLinks, ...globalLinks]
}
