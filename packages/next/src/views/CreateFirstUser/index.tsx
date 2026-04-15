import type { AdminViewServerProps } from 'payload'

import { CreateFirstUserView as CreateFirstUserViewUI } from '@payloadcms/ui/views/CreateFirstUser'
import { getCreateFirstUserData } from '@payloadcms/ui/views/CreateFirstUser/getCreateFirstUserData'
import React from 'react'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'

export async function CreateFirstUserView({ initPageResult }: AdminViewServerProps) {
  const { locale, req } = initPageResult

  const data = await getCreateFirstUserData({ locale, renderComponent: RenderServerComponent, req })

  return <CreateFirstUserViewUI {...data} />
}
