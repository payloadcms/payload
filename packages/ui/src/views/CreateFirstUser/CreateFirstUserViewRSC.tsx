import type { AdminViewServerProps } from 'payload'

import React from 'react'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { getCreateFirstUserData } from './getCreateFirstUserData.js'
import { CreateFirstUserView as CreateFirstUserViewUI } from './index.js'

/**
 * Framework-agnostic Create First User view RSC.
 *
 * Fetches data via `getCreateFirstUserData` and renders the presentational
 * `CreateFirstUserView` from ui. Pure server component; no navigation effects.
 */
export const CreateFirstUserViewRSC = async ({ initPageResult }: AdminViewServerProps) => {
  const { locale, req } = initPageResult
  const data = await getCreateFirstUserData({
    locale,
    renderComponent: RenderServerComponent,
    req,
  })
  return <CreateFirstUserViewUI {...data} />
}
