import { Payload } from '../../src';
import { CollectionConfig } from '../../src/collections/config/types';
import { EndpointHandler } from '../../src/config/types';

const Endpoints: CollectionConfig = {
  slug: 'endpoints',
  labels: {
    singular: 'Endpoint',
    plural: 'Endpoints',
  },
  admin: {
    useAsTitle: 'title',
  },
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: () => true,
  },
  endpoints: [
    {
      route: '/say-hello/joe-bloggs',
      method: 'get',
      handlers: [
        (function sayHelloJoeBloggs(this: Payload, req, res) {
          return res.json({ message: `Hey Joey! Welcome to ${this.getAPIURL()}` });
        }) as EndpointHandler,
      ],
    },
    {
      route: '/say-hello/:group/:name',
      method: 'get',
      handlers: [
        ((req, res) => {
          return res.json({ message: `Hello ${req.params.name} @ ${req.params.group}` });
        }) as EndpointHandler,
      ],
    },
    {
      route: '/say-hello/:name',
      method: 'get',
      handlers: [
        ((req, res) => {
          return res.json({ message: `Hello ${req.params.name}!` });
        }) as EndpointHandler,
      ],
    },
    {
      route: '/whoami',
      method: 'post',
      handlers: [
        ((req, res) => {
          return res.json({ message: `${req.body.name ? `You're ${req.body.name}` : 'I don\'t know who you are'} ${!!req.body.name !== !!req.body.age ? 'but' : 'and'} ${req.body.age ? `you're ${req.body.age} years old.` : 'I don\'t know how old you are'}` });
        }) as EndpointHandler,
      ],
    },
  ],
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
    },
  ],
};

export default Endpoints;
