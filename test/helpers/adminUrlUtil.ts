import type { Config } from 'payload'

import { formatAdminURL } from '@payloadcms/ui/shared'

export class AdminUrlUtil {
  account: string

  admin: string

  create: string

  list: string

  constructor(serverURL: string, slug: string, routes?: Config['routes']) {
    this.admin = formatAdminURL({
      adminRoute: routes?.admin || '/',
      path: '',
      serverURL,
    })

    this.account = formatAdminURL({
      adminRoute: routes?.admin || '/admin',
      path: '/account',
      serverURL,
    })

    this.list = formatAdminURL({
      adminRoute: routes?.admin || '/admin',
      path: `/collections/${slug}`,
      serverURL,
    })

    this.create = formatAdminURL({
      adminRoute: routes?.admin || '/admin',
      path: `/collections/${slug}/create`,
      serverURL,
    })
  }

  collection(slug: string): string {
    return `${this.admin}/collections/${slug}`
  }

  edit(id: number | string): string {
    return `${this.list}/${id}`
  }

  global(slug: string): string {
    return `${this.admin}/globals/${slug}`
  }
}
