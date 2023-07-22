export class AdminUrlUtil {
  account: string;

  admin: string;

  list: string;

  create: string;

  constructor(serverURL: string, slug: string) {
    this.account = `${serverURL}/admin/account`;
    this.admin = `${serverURL}/admin`;
    this.list = `${this.admin}/collections/${slug}`;
    this.create = `${this.list}/create`;
  }

  edit(id: string): string {
    return `${this.list}/${id}`;
  }

  collection(slug: string): string {
    return `${this.admin}/collections/${slug}`;
  }

  global(slug: string): string {
    return `${this.admin}/globals/${slug}`;
  }
}
