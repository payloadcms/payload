import { Payload } from 'payload';
import { home } from './home';
import { settings } from './settings';

export const seed = async (payload: Payload) => {
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
    },
  });

  const settingsJSON = JSON.parse(
    JSON.stringify(settings),
  )

  await payload.create({
    collection: 'settings',
    data: settingsJSON,
  });

  const homePageJSON = JSON.parse(
    JSON.stringify(home),
  );

  await payload.create({
    collection: 'pages',
    data: homePageJSON,
  });


};
