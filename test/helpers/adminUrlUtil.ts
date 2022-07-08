export class AdminUrlUtil {
  admin: string;

  collection: string;

  create: string;

  constructor(serverURL: string, slug: string) {
    this.admin = `${serverURL}/admin`;
    this.collection = `${this.admin}/collections/${slug}`;
    this.create = `${this.collection}/create`;
  }

  doc(id: string): string {
    return `${this.collection}/${id}`;
  }
}
