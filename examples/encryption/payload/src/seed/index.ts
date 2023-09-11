import { Payload } from 'payload';
import { home } from './home';

export const seed = async (payload: Payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
      userDOB: '03-17-1992',
    },
  });

  const homePageJSON = JSON.parse(
    JSON.stringify(home),
  );

  await payload.create({
    collection: 'pages',
    data: homePageJSON,
  });
};
