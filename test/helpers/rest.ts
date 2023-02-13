/* eslint-disable @typescript-eslint/no-explicit-any */
import qs from 'qs';
import fetch from 'node-fetch';
import type { Config } from '../../src/config/types';
import type { PaginatedDocs } from '../../src/mongoose/types';
import type { Where } from '../../src/types';
import { devUser } from '../credentials';

type Args = {
  serverURL: string;
  defaultSlug: string;
};

type LoginArgs = {
  email: string;
  password: string;
  collection: string;
};

type CreateArgs<T = any> = {
  slug?: string;
  data: T;
  auth?: boolean;
  file?: boolean;
};

type FindArgs = {
  slug?: string;
  query?: Where;
  auth?: boolean;
  depth?: number
  page?: number
  limit?: number
};

type FindByIDArgs = {
  id: string | number;
  slug?: string;
  query?: Where;
  auth?: boolean;
  options?: {
    depth?: number
    page?: number
    limit?: number
  },
};

type UpdateArgs<T = any> = {
  slug?: string;
  id: string;
  data: Partial<T>;
  auth?: boolean;
  query?: any;
};
type DeleteArgs = {
  slug?: string;
  id: string;
  auth?: boolean;
};

type FindGlobalArgs<T = any> = {
  slug?: string;
  auth?: boolean;
}

type UpdateGlobalArgs<T = any> = {
  slug?: string;
  auth?: boolean;
  data: Partial<T>;
}

type DocResponse<T> = {
  status: number;
  doc: T;
  errors?: { name: string, message: string, data: any }[]
};

const headers = {
  'Content-Type': 'application/json',
  Authorization: '',
};

type QueryResponse<T> = {
  status: number;
  result: PaginatedDocs<T>;
};

export class RESTClient {
  private readonly config: Config;

  private token: string;

  private defaultSlug: string;

  serverURL: string;

  constructor(config: Config, args: Args) {
    this.config = config;
    this.serverURL = args.serverURL;
    this.defaultSlug = args.defaultSlug;
  }

  async login(incomingArgs?: LoginArgs): Promise<string> {
    const args = incomingArgs ?? {
      email: devUser.email,
      password: devUser.password,
      collection: 'users',
    };

    const response = await fetch(`${this.serverURL}/api/${args.collection}/login`, {
      body: JSON.stringify({
        email: args.email,
        password: args.password,
      }),
      headers,
      method: 'post',
    });

    const { token } = await response.json();

    this.token = token;

    return token;
  }

  async create<T = any>(args: CreateArgs): Promise<DocResponse<T>> {
    const options = {
      body: args.file ? args.data : JSON.stringify(args.data),
      headers: {
        ...(args.file ? [] : headers),
        Authorization: '',
      },
      method: 'post',
    };

    if (args.auth) {
      options.headers.Authorization = `JWT ${this.token}`;
    }

    const slug = args.slug || this.defaultSlug;
    const response = await fetch(`${this.serverURL}/api/${slug}`, options);
    const { status } = response;
    const { doc } = await response.json();
    return { status, doc };
  }

  async find<T = any>(args?: FindArgs): Promise<QueryResponse<T>> {
    const options = {
      headers: {
        ...headers,
        Authorization: args?.auth !== false && this.token ? `JWT ${this.token}` : '',
      },
    };

    const slug = args?.slug || this.defaultSlug;
    const whereQuery = qs.stringify({
      ...(args?.query ? { where: args.query } : {}),
      limit: args?.limit,
      page: args?.page,
    }, {
      addQueryPrefix: true,
    });
    const fetchURL = `${this.serverURL}/api/${slug}${whereQuery}`;
    const response = await fetch(fetchURL, options);
    const { status } = response;
    const result = await response.json();
    if (result.errors) throw new Error(result.errors[0].message);
    return { status, result };
  }

  async update<T = any>(args: UpdateArgs<T>): Promise<DocResponse<T>> {
    const { slug, id, data, query } = args;
    const formattedQs = qs.stringify(query);
    if (args?.auth) {
      headers.Authorization = `JWT ${this.token}`;
    }
    const response = await fetch(`${this.serverURL}/api/${slug || this.defaultSlug}/${id}${formattedQs}`, {
      body: JSON.stringify(data),
      headers,
      method: 'PATCH',
    });
    const { status } = response;
    const json = await response.json();
    return { status, doc: json.doc, errors: json.errors };
  }

  async findByID<T = any>(args: FindByIDArgs): Promise<DocResponse<T>> {
    const options = {
      headers: {
        ...headers,
        Authorization: args?.auth !== false && this.token ? `JWT ${this.token}` : '',
      },
    };

    const formattedOpts = qs.stringify(args?.options || {}, { addQueryPrefix: true });
    const fetchURL = `${this.serverURL}/api/${args?.slug || this.defaultSlug}/${args.id}${formattedOpts}`;
    const response = await fetch(fetchURL, {
      headers: options.headers,
      method: 'get',
    });
    const { status } = response;
    const doc = await response.json();
    return { status, doc };
  }

  async delete<T = any>(id: string, args?: DeleteArgs): Promise<DocResponse<T>> {
    const options = {
      headers: {
        ...headers,
        Authorization: '',
      },
      method: 'delete',
    };

    if (args?.auth) {
      options.headers.Authorization = `JWT ${this.token}`;
    }

    const response = await fetch(`${this.serverURL}/api/${args?.slug || this.defaultSlug}/${id}`, options);
    const { status } = response;
    const doc = await response.json();
    return { status, doc };
  }

  async findGlobal<T = any>(args?: FindGlobalArgs): Promise<DocResponse<T>> {
    const options = {
      headers: {
        ...headers,
      },
      Authorization: '',
      method: 'get',
    };
    if (args?.auth) {
      options.headers.Authorization = `JWT ${this.token}`;
    }
    const response = await fetch(`${this.serverURL}/api/globals/${args?.slug || this.defaultSlug}`, options);
    const { status } = response;
    const doc = await response.json();
    return { status, doc };
  }

  async updateGlobal<T = any>(args: UpdateGlobalArgs): Promise<DocResponse<T>> {
    const { slug, data: body, auth } = args;
    const options = {
      body: JSON.stringify(body),
      method: 'post',
      headers: {
        ...headers,
        Authorization: '',
      },
    };
    if (auth) {
      options.headers.Authorization = `JWT ${this.token}`;
    }
    const response = await fetch(`${this.serverURL}/api/globals/${slug || this.defaultSlug}`, options);
    const { status } = response;
    const { result } = await response.json();
    return { status, doc: result };
  }

  async endpoint<T = any>(path: string, method = 'get', params: any = undefined): Promise<{ status: number, data: T }> {
    const response = await fetch(`${this.serverURL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      method,
    });
    const { status } = response;
    const data = await response.json();
    return { status, data };
  }
}
