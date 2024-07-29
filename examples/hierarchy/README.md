# Payload Hierarchy Example

This example demonstrates how to achieve a virtual hierarchy between documents in your [Payload](https://github.com/payloadcms/payload) application.

## Quick Start

To spin up the project locally, follow these steps:

1. First clone the repo
1. Then `cd YOUR_PROJECT_REPO && cp .env.example .env`
1. Next `yarn && yarn dev` (or `docker-compose up`, see [Docker](#docker))
1. Now Open [http://localhost:3000/admin](http://localhost:3000/admin)  to access the admin panel
1. Create your first admin user using the form on the page

That's it! Changes made in `./src` will be reflected in your app.

## How it works

This example achieves parent/child relationships between your documents through the use of virtual fields. When you query a document with the `?children=true` query param, an afterRead hook is used to populate the documents within its own tree.

For more information on how virtual fields, see the [Official Virtual Fields Example](https://github.com/payloadcms/payload/tree/main/examples/virtual-fields).

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend any of this functionality.

- #### Users

  The `users` collection is a default payload users collection.

- #### Entities

  The `entities` collection can define a parent as any other entity.  It has a virtual field that will also populate children when it is called via the API using a query `children=true`. See [Virtual Fields](https://github.com/payloadcms/payload/tree/main/examples/virtual-fields) for more details on how virtual fields work. 
  
  The virtual field retrieves __all__ children which includes other entities and people.

- #### People

  The `people` collection is a collection that can define an array of parent entities.  It also has an allocation field.  This is for demonstrating attaching data to a parent-child relationship.

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
