# Payload Email Example

This example demonstrates how to integrate email functionality into Payload.

## Quick Start

To spin up this example locally, follow these steps:

1. Run the following command to create a project from the example:

- `npx create-payload-app --example email`

2. `cp .env.example .env` to copy the example environment variables
3. `pnpm install && pnpm dev` to install dependencies and start the dev server
4. open `http://localhost:3000/admin` to access the admin panel
5. Create your first user

## How it works

Email functionality in Payload is configured using adapters. The recommended adapter for most use cases is the [@payloadcms/email-nodemailer](https://www.npmjs.com/package/@payloadcms/email-nodemailer) package.

To enable email, pass your adapter configuration to the `email` property in the Payload Config. This allows Payload to send auth-related emails for password resets, new user verifications, and other email needs.

1. In the Payload Config file, add your email adapter to the `email` property. For example, the `@payloadcms/email-nodemailer` adapter can be configured for SMTP, SendGrid, or other supported transports. During development, if no configuration is provided, Payload will use a mock service via [ethereal.email](ethereal.email).

Now we can start sending email!

2. Go to `src/collections/Newsletter.ts` - with an `afterChange` hook, we are sending an email when a new user signs up for the newsletter

Let's not forget our authentication emails...

3. Auth-enabled collections have built-in options to verify the user and reset the user password. Open `src/collections/Users.ts` and see how we customize these emails.

Speaking of customization...

4. Take a look at `src/email/generateEmailHTML` and how it compiles a custom template when sending email. You change this to any HTML template of your choosing.

That's all you need, now you can go ahead and test out this repo by creating a new `user` or `newsletter-signup` and see the email integration in action.

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

## Production

To run Payload in production, you need to build and start the Admin panel. To do so, follow these steps:

1. Invoke the `next build` script by running `pnpm build` or `npm run build` in your project root. This creates a `.next` directory with a production-ready admin bundle.
1. Finally run `pnpm start` or `npm run start` to run Node in production and serve Payload from the `.build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Resources

For more information on integrating email, check out these resources:

<!-- Update with live blog post URL when published -->

- [Blog Post - Email 101](https://payloadcms.com/blog)
- [Email Documentation](https://payloadcms.com/docs/email/overview#email-functionality)

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
