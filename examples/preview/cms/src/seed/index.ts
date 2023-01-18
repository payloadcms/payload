import { Payload } from 'payload';
import { home } from './home';

export const seed = async (payload: Payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
    },
  });

  const homepageJSON = JSON.parse(JSON.stringify(home));

  await payload.create({
    collection: 'pages',
    data: homepageJSON,
  });
};
