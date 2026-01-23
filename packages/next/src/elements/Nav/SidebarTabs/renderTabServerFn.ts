import type { ServerFunction } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'

export type RenderTabServerFnArgs = {
  tabSlug: string
}

export type RenderTabServerFnReturnType = {
  component: React.ReactNode
}

export const renderTabHandler: ServerFunction<
  RenderTabServerFnArgs,
  RenderTabServerFnReturnType
> = ({ req, tabSlug }) => {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const { importMap } = req.payload
  const { tabs } = req.payload.config.admin.components?.sidebar || {}

  if (!tabs) {
    return { component: null }
  }

  const tabConfig = tabs.find((tab) => tab.slug === tabSlug)

  if (!tabConfig) {
    return { component: null }
  }

  try {
    const component = RenderServerComponent({
      Component: tabConfig.component,
      importMap,
      serverProps: {
        i18n: req.i18n,
        locale: req.locale,
        params: req.routeParams,
        payload: req.payload,
        searchParams: req.query,
        user: req.user,
      },
    })

    return { component }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    req.payload.logger.error({
      err: error,
      msg: `Error rendering tab "${tabSlug}": ${errorMessage}`,
    })

    return { component: null }
  }
}
