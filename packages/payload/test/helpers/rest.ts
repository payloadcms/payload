/* eslint-disable @typescript-eslint/no-explicit-any */
import qs from 'qs';
import fetch from 'node-fetch';
import type { Config } from '../../src/config/types.js';
import type { Where } from '../../src/types.js';
import { devUser } from '../credentials.js';
import type { PaginatedDocs } from '../../src/database/types.js';

type Args = {
  serverURL: string;
  defaultSlug: string;
};

type LoginArgs = {
  email: string;
  password: string;
  collection: string;
};

type LogoutArgs = {
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

type UpdateManyArgs<T = any> = {
  slug?: string;
  data: Partial<T>;
  auth?: boolean;
  where: any;
};

type DeleteArgs = {
  slug?: string;
  id: string;
  auth?: boolean;
};

type DeleteManyArgs = {
  slug?: string;
  auth?: boolean;
  where: any;
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

type DocsResponse<T> = {
  status: number;
  docs: T[];
  errors?: { name: string, message: string, data: any, id: string | number }[]
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
      method: 'POST',
    });

    let { token } = await response.json();

    // If the token is not in the response body, then we can extract it from the cookies
    if (!token) {
      const setCookie = response.headers.get('Set-Cookie');
      const tokenMatchResult = setCookie?.match(/payload-token=(?<token>.+?);/);
      token = tokenMatchResult?.groups?.token;
    }

    this.token = token;

    return token;
  }

  async logout(incomingArgs?: LogoutArgs): Promise<void> {
    const args = incomingArgs ?? {
      collection: 'users',
    };

    await fetch(`${this.serverURL}/api/${args.collection}/logout`, {
      headers,
      method: 'POST',
    });

    this.token = '';
  }

  async create<T = any>(args: CreateArgs): Promise<DocResponse<T>> {
    const options = {
      body: args.file ? args.data : JSON.stringify(args.data),
      headers: {
        ...(args.file ? [] : headers),
        Authorization: '',
      },
      method: 'POST',
    };

    if (args?.auth !== false && this.token) {
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
      headers: { ...headers },
    };

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`;
    }

    const whereQuery = qs.stringify({
      ...(args?.query ? { where: args.query } : {}),
      limit: args?.limit,
      page: args?.page,
    }, {
      addQueryPrefix: true,
    });

    const slug = args?.slug || this.defaultSlug;
    const response = await fetch(`${this.serverURL}/api/${slug}${whereQuery}`, options);
    const { status } = response;
    const result = await response.json();
    if (result.errors) throw new Error(result.errors[0].message);
    return { status, result };
  }

  async update<T = any>(args: UpdateArgs<T>): Promise<DocResponse<T>> {
    const { id, query, data } = args;

    const options = {
      body: JSON.stringify(data),
      headers: { ...headers },
      method: 'PATCH',
    };

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`;
    }

    const formattedQs = qs.stringify(query);
    const slug = args.slug || this.defaultSlug;
    const response = await fetch(`${this.serverURL}/api/${slug}/${id}${formattedQs}`, options);
    const { status } = response;
    const json = await response.json();
    return { status, doc: json.doc, errors: json.errors };
  }

  async updateMany<T = any>(args: UpdateManyArgs<T>): Promise<DocsResponse<T>> {
    const { data, where } = args;
    const options = {
      body: JSON.stringify(data),
      headers: { ...headers },
      method: 'PATCH',
    };

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`;
    }

    const formattedQs = qs.stringify({
      ...(where ? { where } : {}),
    }, {
      addQueryPrefix: true,
    });

    const slug = args?.slug || this.defaultSlug;
    const response = await fetch(`${this.serverURL}/api/${slug}${formattedQs}`, options);
    const { status } = response;
    const json = await response.json();
    return { status, docs: json.docs, errors: json.errors };
  }

  async deleteMany<T = any>(args: DeleteManyArgs): Promise<DocsResponse<T>> {
    const { where } = args;
    const options = {
      headers: { ...headers },
      method: 'DELETE',
    };

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`;
    }

    const formattedQs = qs.stringify({
      ...(where ? { where } : {}),
    }, {
      addQueryPrefix: true,
    });

    const slug = args?.slug || this.defaultSlug;
    const response = await fetch(`${this.serverURL}/api/${slug}${formattedQs}`, options);
    const { status } = response;
    const json = await response.json();
    return { status, docs: json.docs, errors: json.errors };
  }

  async findByID<T = any>(args: FindByIDArgs): Promise<DocResponse<T>> {
    const options = {
      headers: { ...headers },
    };

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`;
    }

    const slug = args?.slug || this.defaultSlug;
    const formattedOpts = qs.stringify(args?.options || {}, { addQueryPrefix: true });
    const response = await fetch(`${this.serverURL}/api/${slug}/${args.id}${formattedOpts}`, options);
    const { status } = response;
    const doc = await response.json();
    return { status, doc };
  }

  async delete<T = any>(id: string, args?: DeleteArgs): Promise<DocResponse<T>> {
    const options = {
      headers: { ...headers },
      method: 'DELETE',
    };

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`;
    }

    const slug = args?.slug || this.defaultSlug;
    const response = await fetch(`${this.serverURL}/api/${slug}/${id}`, options);
    const { status } = response;
    const doc = await response.json();
    return { status, doc };
  }

  async findGlobal<T = any>(args?: FindGlobalArgs): Promise<DocResponse<T>> {
    const options = {
      headers: { ...headers },
    };

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`;
    }

    const slug = args?.slug || this.defaultSlug;
    const response = await fetch(`${this.serverURL}/api/globals/${slug}`, options);
    const { status } = response;
    const doc = await response.json();
    return { status, doc };
  }

  async updateGlobal<T = any>(args: UpdateGlobalArgs): Promise<DocResponse<T>> {
    const { data } = args;
    const options = {
      body: JSON.stringify(data),
      headers: { ...headers },
      method: 'POST',
    };

    if (args?.auth !== false && this.token) {
      options.headers.Authorization = `JWT ${this.token}`;
    }

    const slug = args?.slug || this.defaultSlug;
    const response = await fetch(`${this.serverURL}/api/globals/${slug}`, options);
    const { status } = response;
    const { result } = await response.json();
    return { status, doc: result };
  }

  async endpoint<T = any>(path: string, method = 'GET', params: any = undefined): Promise<{ status: number, data: T }> {
    const options = {
      body: JSON.stringify(params),
      headers: { ...headers },
      method,
    };

    const response = await fetch(`${this.serverURL}${path}`, options);
    const { status } = response;
    const data = await response.json();
    return { status, data };
  }

  async endpointWithAuth<T = any>(path: string, method = 'GET', params: any = undefined): Promise<{ status: number, data: T }> {
    const options = {
      body: JSON.stringify(params),
      headers: { ...headers },
      method,
    };

    if (this.token) {
      options.headers.Authorization = `JWT ${this.token}`;
    }

    const response = await fetch(`${this.serverURL}${path}`, options);
    const { status } = response;
    const data = await response.json();
    return { status, data };
  }
}
