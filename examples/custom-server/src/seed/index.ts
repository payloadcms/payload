import type { Payload } from 'payload'

export const seed = async (payload: Payload): Promise<void> => {
  // create admin
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
    },
  })

  // create home page
  await Promise.all([
    await payload.create({
      collection: 'pages',
      data: {
        title: 'Home',
        richText: [
          {
            children: [
              {
                text: 'Payload Custom Server Example',
              },
            ],
            type: 'h1',
          },
          {
            children: [
              {
                text: 'This is an example of how to host ',
              },
              {
                type: 'link',
                linkType: 'custom',
                url: 'https://payloadcms.com',
                children: [
                  {
                    text: 'Payload',
                  },
                ],
                newTab: true,
              },
              {
                text: ' alongside your front-end by sharing a single Express server. You are currently browsing a ',
              },
              {
                type: 'link',
                linkType: 'custom',
                url: 'https://nextjs.org',
                children: [
                  {
                    text: 'Next.js',
                  },
                ],
                newTab: true,
              },
              {
                text: ' app, but you can easily swap in any framework you like—check out the ',
              },
              {
                type: 'link',
                linkType: 'custom',
                url: 'http://github.com/payloadcms/payload/tree/master/examples/custom-server',
                children: [
                  {
                    text: 'README.md',
                  },
                ],
              },
              {
                text: ' for instructions on how to do this. ',
              },
              {
                type: 'link',
                linkType: 'custom',
                url: 'http://localhost:3000/admin',
                children: [
                  {
                    text: 'Click here',
                  },
                ],
              },
              {
                text: ' to navigate to the admin panel and login.',
              },
            ],
          },
        ],
      },
    }),
  ])
}
