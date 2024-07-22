import type { Config } from 'payload'

export class AdminUrlUtil {
  account: string

  admin: string

  create: string

  list: string

  constructor(serverURL: string, slug: string, routes?: Config['routes']) {
    const adminRoute = routes?.admin || '/admin'

    this.account = `${serverURL}${adminRoute}/account`
    this.admin = `${serverURL}${adminRoute}`
    this.list = `${this.admin}/collections/${slug}`
    this.create = `${this.list}/create`
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
