import { Endpoint } from '../../config/types';

export const globalEndpointDefaults: Record<'versions' | 'crud', Omit<Endpoint, 'handlers'>[]> = {
  versions: [
    {
      method: 'get',
      route: '/',
    },
    {
      method: 'post',
      route: '/',
    },
  ],
  crud: [
    {
      method: 'get',
      route: '/versions',
    },
    {
      method: 'get',
      route: '/versions/:id',
    },
    {
      method: 'post',
      route: '/versions/:id',
    },
  ],
};
