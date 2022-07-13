export class AdminUrlUtil {
  admin: string;

  list: string;

  create: string;

  constructor(serverURL: string, slug: string) {
    this.admin = `${serverURL}/admin`;
    this.list = `${this.admin}/collections/${slug}`;
    this.create = `${this.list}/create`;
  }

  edit(id: string): string {
    return `${this.list}/${id}`;
  }
}
