# Payload Preview Example Front-End

This is a [Next.js](https://nextjs.org) app using the [Pages Router](https://nextjs.org/docs/pages). It was made explicitly for Payload's [Preview Example](https://github.com/payloadcms/payload/tree/master/examples/preview/cms).

> This example uses the Pages Router, the legacy API of Next.js. If your app is using the latest [App Router](https://nextjs.org/docs/app), check out the official [App Router Example](https://github.com/payloadcms/payload/tree/master/examples/preview/nextjs).

## Getting Started

### Payload

First you'll need a running [Payload](https://github.com/payloadcms/payload) app. If you have not done so already, open up the `cms` folder and follow the setup instructions. Take note of your `serverURL`, you'll need this in the next step.

### Next.js

1. Clone this repo
2. `cd` into this directory and run `yarn` or `npm install`
3. `cp .env.example .env` to copy the example environment variables
4. `yarn dev` or `npm run dev` to start the server
5. `open http://localhost:3000` to see the result

Once running you will find a couple seeded pages on your local environment with some basic instructions. You can also start editing the pages by modifying the documents within Payload. See the [Preview Example](https://github.com/payloadcms/payload/tree/master/examples/preview/cms) for full details.

## Learn More

To learn more about Payload and Next.js, take a look at the following resources:

- [Payload Documentation](https://payloadcms.com/docs) - learn about Payload features and API.
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Payload GitHub repository](https://github.com/payloadcms/payload) as well as [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js. You could also combine this app into a [single Express server](https://github.com/payloadcms/nextjs-custom-server) and deploy in to [Payload Cloud](https://payloadcms.com/new/import).

Check out our [Payload deployment documentation](https://payloadcms.com/docs/production/deployment) or the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
