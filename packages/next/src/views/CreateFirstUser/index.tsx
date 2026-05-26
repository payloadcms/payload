import type { AdminViewServerProps } from 'payload'

import { CreateFirstUserView as CreateFirstUserViewBase } from '@payloadcms/ui/views/CreateFirstUser'
import React from 'react'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'

export function CreateFirstUserView(props: AdminViewServerProps) {
  return <CreateFirstUserViewBase {...props} renderComponent={RenderServerComponent} />
}
