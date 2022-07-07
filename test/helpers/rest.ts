import qs from 'qs';
import { Config } from '../../src/config/types';
import { PaginatedDocs } from '../../src/mongoose/types';

/* eslint-disable @typescript-eslint/no-use-before-define */
require('isomorphic-fetch');

type Args = {
  serverURL: string
}

type LoginArgs = {
  email: string
  password: string
  collection: string
}

type CreateArgs = {
  slug: string
  data: Record<string, unknown>
  auth?: boolean
}

type FindArgs = {
  slug: string
  query?: any
  auth?: boolean
}

type UpdateArgs = {
  slug: string
  id: string
  data: Record<string, unknown>
  query?: any
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: '',
};

export class RESTClient {
  private readonly config: Config;

  private token: string;

  private serverURL: string;

  constructor(config: Config, args: Args) {
    this.config = config;
    this.serverURL = args.serverURL;
  }

  async login(incomingArgs?: LoginArgs): Promise<string> {
    const args = incomingArgs ?? {
      email: 'dev@payloadcms.com',
      password: 'test',
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

  async create(args: CreateArgs): Promise<{ status: number; doc: any }> {
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

    const response = await fetch(`${this.serverURL}/api/${args.slug}`, options);
    const { status } = response;
    const { doc } = await response.json();
    return { status, doc };
  }

  async find(args: FindArgs): Promise<{ status: number; result: PaginatedDocs }> {
    const options = {
      headers: {
        ...headers,
        Authorization: '',
      },
    };

    if (args.auth) {
      options.headers.Authorization = `JWT ${this.token}`;
    }

    const response = await fetch(`${this.serverURL}/api/${args.slug}${qs.stringify(args.query || {})}`, options);
    const { status } = response;
    const result = await response.json();
    return { status, result };
  }

  async update(args: UpdateArgs): Promise<{ status: number; doc: any }> {
    const { slug, id, body, query } = args;
    const formattedQs = qs.stringify(query);
    const response = await fetch(`${this.serverURL}/api/${slug}/${id}${formattedQs}`, {
      body: JSON.stringify(body),
      headers: this.headers,
      method: 'put',
    });
    const { status } = response;
    const json = await response.json();
    return { status, doc: json.doc };
  }

  async findByID(collectionSlug: string, id: string): Promise<{ status: number; doc: any }> {
    const response = await fetch(`${this.serverURL}/api/${collectionSlug}/${id}`, {
      headers: this.headers,
      method: 'get',
    });
    const { status } = response;
    const doc = await response.json();
    return { status, doc };
  }
}
