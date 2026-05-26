import type { AdminViewServerProps } from 'payload'

import { AccountView as AccountViewBase } from '@payloadcms/ui/views/Account'
import { notFound } from 'next/navigation.js'
import React from 'react'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'

export function AccountView(props: AdminViewServerProps) {
  return (
    <AccountViewBase {...props} onNotFound={notFound} renderComponent={RenderServerComponent} />
  )
}
