# Payload Live Preview Example Front-End

This is a [Next.js](https://nextjs.org) app using the [Pages Router](https://nextjs.org/docs/pages). It was made explicitly for Payload's [Live Preview Example](https://github.com/payloadcms/payload/tree/main/examples/live-preview/payload).

> This example uses the Pages Router, the legacy API of Next.js. If your app is using the latest [App Router](https://nextjs.org/docs/app), check out the official [App Router Example](https://github.com/payloadcms/payload/tree/main/examples/live-preview/next-app).

**IMPORTANT—This application runs on a different server as Payload and establishes a connection from another domain or port over HTTP.** For an integrated setup that runs on a single server and uses the [Local API](https://payloadcms.com/docs/local-api/overview#local-api), check out [how to serve Payload alongside Next.js](https://github.com/payloadcms/payload/tree/main/examples/live-preview/payload). To learn more about this, check out [how Payload can be used in its various headless capacities](https://payloadcms.com/blog/the-ultimate-guide-to-using-nextjs-with-payload).

## Getting Started

### Payload

First you'll need a running Payload app. There is one made explicitly for this example and [can be found here](https://github.com/payloadcms/payload/tree/main/examples/live-preview/payload). If you have not done so already, clone it down and follow the setup instructions there. This will provide all the necessary APIs that your Next.js app requires for live preview.

### Next.js

1. Clone this repo
2. `cd` into this directory and run `pnpm i --ignore-workspace`\*, `yarn`, or `npm install`
   > \*If you are running using pnpm within the Payload Monorepo, the `--ignore-workspace` flag is needed so that pnpm generates a lockfile in this example's directory despite the fact that one exists in root.
3. `cp .env.example .env` to copy the example environment variables
4. `pnpm dev`, `yarn dev`, or `npm run dev` to start the server
5. `open http://localhost:3001` to see the result

Once running you will find a couple seeded pages on your local environment with some basic instructions. You can also start editing the pages by modifying the documents within Payload. See the [Live Preview Example](https://github.com/payloadcms/payload/tree/main/examples/live-preview/payload) for full details.

## Learn More

To learn more about Payload and Next.js, take a look at the following resources:

- [Payload Documentation](https://payloadcms.com/docs) - learn about Payload features and API.
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Payload GitHub repository](https://github.com/payloadcms/payload) as well as [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js. You could also combine this app into a [single Express server](https://github.com/payloadcms/payload/tree/main/examples/custom-server) and deploy in to [Payload Cloud](https://payloadcms.com/new/import).

Check out our [Payload deployment documentation](https://payloadcms.com/docs/production/deployment) or the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
