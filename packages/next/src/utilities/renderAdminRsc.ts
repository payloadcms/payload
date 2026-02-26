import type { RscAdminConfig, ServerFunction } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'

export type RenderAdminRscArgs = {
  componentSlot: string
  schemaPath: string
}

export type RenderAdminRscResult = {
  renderedComponent: React.ReactNode
} | null

export const renderAdminRscHandler: ServerFunction<
  RenderAdminRscArgs,
  Promise<RenderAdminRscResult>
> = async (args) => {
  const { adminConfig, componentSlot, req, schemaPath } = args

  const rscConfig = adminConfig as RscAdminConfig | undefined

  if (!rscConfig?.fields?.[schemaPath]?.components) {
    return null
  }

  const components = rscConfig.fields[schemaPath].components
  const Component = components?.[componentSlot as keyof typeof components]

  if (!Component) {
    return null
  }

  const renderedComponent = RenderServerComponent({
    Component: Component as React.ComponentType,
    serverProps: {
      i18n: req.i18n,
      payload: req.payload,
      user: req.user,
    },
  })

  return { renderedComponent }
}
