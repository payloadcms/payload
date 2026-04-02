# Payload Multi-Tenant Example

This example demonstrates how to achieve a multi-tenancy in [Payload](https://github.com/payloadcms/payload). Tenants are separated by a `Tenants` collection.

## Quick Start

To spin up this example locally, follow these steps:

1. Run the following command to create a project from the example:

- `npx create-payload-app --example multi-tenant`

2. `cp .env.example .env` to copy the example environment variables

3. `pnpm dev`, `yarn dev` or `npm run dev` to start the server
   - Press `y` when prompted to seed the database
4. `open http://localhost:3000` to access the home page
5. `open http://localhost:3000/admin` to access the admin panel

### Default users

The seed script seeds 3 tenants.
Login with email `demo@payloadcms.com` and password `demo`

## How it works

A multi-tenant Payload application is a single server that hosts multiple "tenants". Examples of tenants may be your agency's clients, your business conglomerate's organizations, or your SaaS customers.

Each tenant has its own set of users, pages, and other data that is scoped to that tenant. This means that your application will be shared across tenants but the data will be scoped to each tenant.

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend any of this functionality.

- #### Users

  The `users` collection is auth-enabled and encompasses both app-wide and tenant-scoped users based on the value of their `roles` and `tenants` fields. Users with the role `super-admin` can manage your entire application, while users with the _tenant role_ of `admin` have limited access to the platform and can manage only the tenant(s) they are assigned to, see [Tenants](#tenants) for more details.

  For additional help with authentication, see the official [Auth Example](https://github.com/payloadcms/payload/tree/main/examples/cms#readme) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Tenants

  A `tenants` collection is used to achieve tenant-based access control. Each user is assigned an array of `tenants` which includes a relationship to a `tenant` and their `roles` within that tenant. You can then scope any document within your application to any of your tenants using a simple [relationship](https://payloadcms.com/docs/fields/relationship) field on the `users` or `pages` collections, or any other collection that your application needs. The value of this field is used to filter documents in the admin panel and API to ensure that users can only access documents that belong to their tenant and are within their role. See [Access Control](#access-control) for more details.

  For more details on how to extend this functionality, see the [Payload Access Control](https://payloadcms.com/docs/access-control/overview) docs.

  **Domain-based Tenant Setting**:

  This example also supports domain-based tenant selection, where tenants can be associated with a specific domain. If a tenant is associated with a domain (e.g., `gold.localhost:3000`), when a user logs in from that domain, they will be automatically scoped to the matching tenant. This is accomplished through an optional `afterLogin` hook that sets a `payload-tenant` cookie based on the domain.

For the domain portion of the example to function properly, you will need to add the following entries to your system's `/etc/hosts` file:

```
127.0.0.1 gold.localhost silver.localhost bronze.localhost
```

- #### Pages

  Each page is assigned a `tenant`, which is used to control access and scope API requests. Only users with the `super-admin` role can create pages, and pages are assigned to specific tenants. Other users can view only the pages assigned to the tenant they are associated with.

## Access control

Basic role-based access control is set up to determine what users can and cannot do based on their roles, which are:

- `super-admin`: They can access the Payload admin panel to manage your multi-tenant application. They can see all tenants and make all operations.
- `user`: They can only access the Payload admin panel if they are a tenant-admin, in which case they have a limited access to operations based on their tenant (see below).

This applies to each collection in the following ways:

- `users`: Only super-admins, tenant-admins, and the user themselves can access their profile. Anyone can create a user, but only these admins can delete users. See [Users](#users) for more details.
- `tenants`: Only super-admins and tenant-admins can read, create, update, or delete tenants. See [Tenants](#tenants) for more details.
- `pages`: Everyone can access pages, but only super-admins and tenant-admins can create, update, or delete them.

> If you have versions and drafts enabled on your pages, you will need to add additional read access control condition to check the user's tenants that prevents them from accessing draft documents of other tenants.

For more details on how to extend this functionality, see the [Payload Access Control](https://payloadcms.com/docs/access-control/overview#access-control) docs.

## CORS

This multi-tenant setup requires an open CORS policy. Since each tenant contains a dynamic list of domains, there's no way to know specifically which domains to whitelist at runtime without significant performance implications. This also means that the `serverURL` is not set, as this scopes all requests to a single domain.

Alternatively, if you know the domains of your tenants ahead of time and these values won't change often, you could simply remove the `domains` field altogether and instead use static values.

For more details on this, see the [CORS](https://payloadcms.com/docs/production/preventing-abuse#cross-origin-resource-sharing-cors) docs.

## Front-end

The frontend is scaffolded out in this example directory. You can view the code for rendering pages at `/src/app/(app)/[tenant]/[...slug]/page.tsx`. This is a starter template, you may need to adjust the app to better fit your needs.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
