export type Document = {
  id: string;
  [key: string]: any;
};

export type CreateOptions = {
  collection: string;
  data: any;
};

export type FindOptions = {
  collection: string;
  where?: { [key: string]: any };
};

export type FindResponse = {
  docs: Document[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
};

export type FindGlobalOptions = {
  global: string;
};
export type UpdateGlobalOptions = {
  global: string;
  data: any;
};

export type FindByIDOptions = {
  collection: string;
  id: string;
};
export type UpdateOptions = {
  collection: string;
  id: string;
  data: any;
};

export type DeleteOptions = {
  collection: string;
  id: string;
};

export type ForgotPasswordOptions = {
  collection: string;
  generateEmailHTML?: (token: string) => string;
  expiration: Date;
  data: any;
};
