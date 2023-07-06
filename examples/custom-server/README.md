# Payload Custom Server Example

This example demonstrates how to serve your front-end alongside [Payload](https://github.com/payloadcms/payload) in a single Express server. This pattern will cut down on hosting costs and can simplify your deployment process.

## Quick Start

To spin up this example locally, follow these steps:

1. First clone the repo
1. Then `cd YOUR_PROJECT_REPO && cp .env.example .env`
1. Next `yarn && yarn dev`
1. Now `open http://localhost:3000/admin` to access the admin panel
1. Login with email `dev@payloadcms.com` and password `test`

That's it! Changes made in `./src` will be reflected in your app. See the [Development](#development) section for more details.

## How it works

When you use Payload, you plug it into _**your**_ Express server. That's a fundamental difference between Payload and other application frameworks. It means that when you use Payload, you're technically _adding_ Payload to _your_ app, and not building a "Payload app".

One of the strengths of this pattern is that it lets you do powerful things like integrate your Payload instance directly with your front-end. This will allow you to host Payload alongside a fully dynamic, CMS-integrated website or app on a single, combined server—while still getting all of the benefits of a headless CMS.

### Express

In every Payload app is a `server.ts` file in which you instantiate your own Express server and attach Payload to it. This is where you can can add any custom Express middleware or routes you need to serve your front-end. To combine Payload with your framework on the same server, we need to do three main things:

1. Modify your `server.ts` file to build and serve your front-end using the APIs provided by your framework
2. Modify your `package.json` scripts include your framework's build commands
3. Use a separate `tsconfig.server.json` file to build the server, because your front-end may require incompatible TypeScript settings

This example demonstrates how to do this with [Next.js](https://nextjs.org), although the same principles apply to any front-end framework like [Vue](https://vuejs.org), [Nuxt](https://nuxt.com), or [SvelteKit](https://kit.svelte.dev). If your framework does not yet have instructions listed here, please consider contributing them to this example for others to use. To quickly eject Next.js from this example, see the [Eject](#eject) section.

#### Next.js

For Next.js apps, your `server.ts` file looks something like this:

```ts
import next from 'next'
import nextBuild from 'next/dist/build'

// Instantiate Express and Payload
// ...

// If building, start the server to build the Next.js app then exit
if (process.env.NEXT_BUILD) {
  app.listen(3000, async () => {
    await nextBuild(path.join(__dirname, '../'))
    process.exit()
  })

  return
}

// Attach Next.js routes and start the server
const nextApp = next({
  dev: process.env.NODE_ENV !== 'production',
})

const nextHandler = nextApp.getRequestHandler()

app.get('*', (req, res) => nextHandler(req, res))

nextApp.prepare().then(() => {
  app.listen(3000)
})
```

Check out the [server.ts](./src/server.ts) in this repository for a complete working example. You can also see the [Next.js docs](https://nextjs.org/docs/advanced-features/custom-server) for more details.

Then your `package.json` might look something like this:

```json
// ...
"scripts": {
  // ...
  "build:payload": "payload build",
  "build:server": "tsc --project tsconfig.server.json",
  "build:next": "next build",
  "build": "yarn build:payload && yarn build:server && yarn build:next",
}
```

Check out the [package.json](./src/package.json) in this repository for a complete working example. You can also see the [Next.js docs](https://nextjs.org/docs/api-reference/cli#build) for more details.

## Eject

If you prefer another front-end framework or would like to use Payload as a standalone CMS, you can easily eject the front-end from this template. To eject, simply run `yarn eject`. This will uninstall all Next.js related dependencies and delete all files and folders related to the Next.js front-end. It also removes all custom routing from your `server.ts` file and updates your `eslintrc.js`.

> Note: Your eject script may not work as expected if you've made significant modifications to your project. If you run into any issues, compare your project's dependencies and file structure with this template, see [./src/eject](./src/eject) for full details.

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

### Seed

On boot, a seed script is included to scaffold a basic database for you to use as an example. This is done by setting the `PAYLOAD_DROP_DATABASE` and `PAYLOAD_SEED` environment variables which are included in the `.env.example` by default. You can remove these from your `.env` to prevent this behavior. You can also freshly seed your project at any time by running `yarn seed`. This seed creates an admin user with email `dev@payloadcms.com`, password `test`, and a `home` page.

> NOTICE: seeding the database is destructive because it drops your current database to populate a fresh one from the seed template. Only run this command if you are starting a new project or can afford to lose your current data.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First, invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then, run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also choose to self-host your app, check out the [Deployment](https://payloadcms.com/docs/production/deployment) docs for more details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
