# Payload Auth Example Front-End

This is a [Payload](https://payloadcms.com) + [Next.js](https://nextjs.org) app using the [Pages Router](https://nextjs.org/docs/pages) made explicitly for the [Payload Auth Example](https://github.com/payloadcms/payload/tree/master/examples/auth). It demonstrates how  to authenticate your Next.js app using [Payload Authentication](https://payloadcms.com/docs/authentication/overview).

> This example uses the Pages Router, the legacy API of Next.js. If your app is using the latest [App Router](https://nextjs.org/docs/pages), check out the official [App Router Example](https://github.com/payloadcms/payload/tree/master/examples/auth/next-app).

## Getting Started

### Payload

First you'll need a running Payload app. There is one made explicitly for this example and [can be found here](https://github.com/payloadcms/payload/tree/master/examples/auth/payload). If you have not done so already, clone it down and follow the setup instructions there. This will provide all the necessary APIs that your Next.js app requires for authentication.

### Next.js

1. Clone this repo
2. `cd` into this directory and run `yarn` or `npm install`
3. `cp .env.example .env` to copy the example environment variables
4. `yarn dev` or `npm run dev` to start the server
5. `open http://localhost:3001` to see the result

Once running, a user is automatically seeded in your local environment with some basic instructions. See the [Payload Auth Example](https://github.com/payloadcms/payload/tree/master/examples/auth) for full details.

## Learn More

To learn more about Payload and Next.js, take a look at the following resources:

- [Payload Documentation](https://payloadcms.com/docs) - learn about Payload features and API.
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Payload GitHub repository](https://github.com/payloadcms/payload) as well as [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js. You could also combine this app into a [single Express server](https://github.com/payloadcms/payload/tree/master/examples/custom-server) and deploy in to [Payload Cloud](https://payloadcms.com/new/import).

Check out our [Payload deployment documentation](https://payloadcms.com/docs/production/deployment) or the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
