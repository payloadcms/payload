# Payload Auth Example

This [Payload Astro Example](https://github.com/payloadcms/payload/tree/main/examples/astro) demonstrates how to implement Payload with [Astro](https://astro.build) The web framework for content-driven websites. [Quick Start](#quick-start) to get up and running quickly.

## Quick Start

To spin up this example locally, follow the steps below:

1. Run the following command to create a project from the example:

- `npx create-payload-app --example astro`

2. Start the server:
   - Depending on your package manager, run `pnpm dev`, `yarn dev` or `npm run dev`
3. Access the application:
   - Open your browser and navigate to `http://localhost:3000` to access the homepage.
   - Open `http://localhost:3000/admin` to access the admin panel.

## How it works

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

### Users

Defult user collection

### Media

Defult Media collection

### Posts

Example Posts collection

```ts
   {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text',
          required: true,
        },
      ],
    },
```

### Astro

The contents in the posts collection is rendered in astro
