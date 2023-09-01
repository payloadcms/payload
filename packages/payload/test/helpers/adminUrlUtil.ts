export class AdminUrlUtil {
  account: string

  admin: string

  create: string

  list: string

  constructor(serverURL: string, slug: string) {
    this.account = `${serverURL}/admin/account`
    this.admin = `${serverURL}/admin`
    this.list = `${this.admin}/collections/${slug}`
    this.create = `${this.list}/create`
  }

  collection(slug: string): string {
    return `${this.admin}/collections/${slug}`
  }

  edit(id: string): string {
    return `${this.list}/${id}`
  }

  global(slug: string): string {
    return `${this.admin}/globals/${slug}`
  }
}
