import type { Config } from 'payload'

// IMPORTANT: ensure that imports do not contain React components, etc. as this breaks Playwright tests
// Instead of pointing to the bundled code, which will include React components, use direct import paths
import { formatAdminURL } from '../../packages/ui/src/utilities/formatAdminURL.js' // eslint-disable-line payload/no-relative-monorepo-imports

export class AdminUrlUtil {
  account: string

  admin: string

  create: string

  entitySlug: string

  list: string

  login: string

  logout: string

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

    this.login = formatAdminURL({
      adminRoute: this.routes.admin,
      path: '/login',
      serverURL: this.serverURL,
    })

    this.logout = formatAdminURL({
      adminRoute: this.routes.admin,
      path: '/logout',
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
      adminRoute: this.routes?.admin,
      path: `/collections/${slug}`,
      serverURL: this.serverURL,
    })
  }

  edit(id: number | string): string {
    return `${this.list}/${id}`
  }

  global(slug: string): string {
    return formatAdminURL({
      adminRoute: this.routes?.admin,
      path: `/globals/${slug}`,
      serverURL: this.serverURL,
    })
  }
}
