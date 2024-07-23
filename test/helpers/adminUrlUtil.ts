import type { Config } from 'payload'

import { formatAdminURL } from '@payloadcms/ui/shared'

export class AdminUrlUtil {
  account: string

  admin: string

  create: string

  entitySlug: string

  list: string

  routes: Config['routes']

  serverURL: string

  constructor(serverURL: string, slug: string, routes?: Config['routes']) {
    this.routes = {
      admin: routes?.admin || '/admin',
    }

    this.serverURL = serverURL

    this.entitySlug = slug

    this.admin = formatAdminURL({
      adminRoute: this.routes.admin,
      path: '',
      serverURL: this.serverURL,
    })

    this.account = formatAdminURL({
      adminRoute: this.routes.admin,
      path: '/account',
      serverURL: this.serverURL,
    })

    this.list = formatAdminURL({
      adminRoute: this.routes.admin,
      path: `/collections/${this.entitySlug}`,
      serverURL: this.serverURL,
    })

    this.create = formatAdminURL({
      adminRoute: this.routes.admin,
      path: `/collections/${this.entitySlug}/create`,
      serverURL: this.serverURL,
    })
  }

  collection(slug: string): string {
    return formatAdminURL({
      adminRoute: this.routes.admin,
      path: `/collections/${slug}`,
      serverURL: this.serverURL,
    })
  }

  edit(id: number | string): string {
    return formatAdminURL({
      adminRoute: this.routes.admin,
      path: `${this.entitySlug}/${id}`,
      serverURL: this.serverURL,
    })
  }

  global(slug: string): string {
    return formatAdminURL({
      adminRoute: this.routes.admin,
      path: `/globals/${slug}`,
      serverURL: this.serverURL,
    })
  }
}
