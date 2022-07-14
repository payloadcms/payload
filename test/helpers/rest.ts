/* eslint-disable @typescript-eslint/no-explicit-any */
import qs from 'qs';
import type { Config } from '../../src/config/types';
import type { PaginatedDocs } from '../../src/mongoose/types';
import type { Where } from '../../src/types';
import { devUser } from '../credentials';

require('isomorphic-fetch');

type Args = {
  serverURL: string
  defaultSlug: string
}

type LoginArgs = {
  email: string
  password: string
  collection: string
}

type CreateArgs<T = any> = {
  slug?: string
  data: T
  auth?: boolean
}

type FindArgs = {
  slug?: string
  query?: Where
  auth?: boolean
}

type UpdateArgs<T = any> = {
  slug?: string
  id: string
  data: Partial<T>
  query?: any
}

type DocResponse<T> = {
  status: number
  doc: T
}

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

  private serverURL: string;

  private defaultSlug: string;

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
      body: JSON.stringify(args.data),
      headers: {
        ...headers,
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
        Authorization: '',
      },
    };

    if (args?.auth) {
      options.headers.Authorization = `JWT ${this.token}`;
    }

    const slug = args?.slug || this.defaultSlug;
    const whereQuery = qs.stringify(args?.query ? { where: args.query } : {}, {
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
    const response = await fetch(
      `${this.serverURL}/api/${slug || this.defaultSlug}/${id}${formattedQs}`,
      {
        body: JSON.stringify(data),
        headers,
        method: 'put',
      },
    );
    const { status } = response;
    const json = await response.json();
    return { status, doc: json.doc };
  }

  async findByID<T = any>(id: string, args?: { slug?: string }): Promise<DocResponse<T>> {
    const response = await fetch(`${this.serverURL}/api/${args?.slug || this.defaultSlug}/${id}`, {
      headers,
      method: 'get',
    });
    const { status } = response;
    const doc = await response.json();
    return { status, doc };
  }

  async delete<T = any>(id: string, args?: { slug?: string }): Promise<DocResponse<T>> {
    const response = await fetch(`${this.serverURL}/api/${args?.slug || this.defaultSlug}/${id}`, {
      headers,
      method: 'delete',
    });
    const { status } = response;
    const doc = await response.json();
    return { status, doc };
  }
}
