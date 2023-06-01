# Payload Email Example

This example demonstrates how to integrate email functionality into Payload.

## Quick Start

To spin up this example locally, follow these steps:

1. Clone this repo
2. `cd` into this directory and run `yarn` or `npm install`
3. `cp .env.example .env` to copy the example environment variables
4. `yarn dev` or `npm run dev` to start the server and seed the database
5. `open http://localhost:8000/admin` to access the admin panel
6. Create your first user

## How it works

Payload utilizes [NodeMailer](https://nodemailer.com/about/) for email functionality. Once you add your email configuration to `payload.init()`, you send email from anywhere in your application just by calling `payload.sendEmail({})`.

1. Navigate to `src/server.ts` - this is where your email config gets passed to Payload
2. Open `src/email/transport.ts` - here we are defining the email config. You can use an env variable to switch between the mock email transport and live email service.

Now we can start sending email!

3. Go to `src/collections/Newsletter.ts` - with an `afterChange` hook, we are sending an email when a new user signs up for the newsletter

Let's not forget our authentication emails...

4. Auth-enabled collections have built-in options to verify the user and reset the user password. Open `src/collections/Users.ts` and see how we customize these emails.

Speaking of customization...

5. Take a look at `src/email/generateEmailHTML` and how it compiles a custom template when sending email. You change this to any HTML template of your choosing.

That's all you need, now you can go ahead and test out this repo by creating a new `user` or `newsletter-signup` and see the email integration in action.

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Resources

For more information on integrating email, check out these resources:

<!-- Update with live blog post URL when published -->

- [Blog Post - Email 101](https://payloadcms.com/blog)
- [Email Documentation](https://payloadcms.com/docs/email/overview#email-functionality)

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/r6sCXqVk3v) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
