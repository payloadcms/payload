import type { AdminViewServerProps } from 'payload'

import { AccountView as AccountViewFromUI } from '@payloadcms/ui/views/Account/RenderAccount'
import { notFound } from 'next/navigation.js'

export async function AccountView(props: AdminViewServerProps) {
  try {
    return await AccountViewFromUI(props)
  } catch (error) {
    if (error?.message === 'not-found') {
      return notFound()
    }
    throw error
  }
}
