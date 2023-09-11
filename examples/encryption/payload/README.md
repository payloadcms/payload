# Payload Encryption Example

This example demonstrates how to integrate encryption and decryption into Payload.

There are various fully working front-ends made explicitly for this example, including:

- [Next.js App Router](../next-app)
- [Next.js Pages Router](../next-pages)

Follow the instructions in each respective README to get started.

## Quick Start

To spin up this example locally, follow these steps:

1. Clone this repo
2. `cd` into this directory and run `yarn` or `npm install`
3. `cp .env.example .env` to copy the example environment variables
4. `yarn dev` or `npm run dev` to start the server and seed the database
5. `open http://localhost:8000/admin` to access the admin panel
6. Login with email `dev@payloadcms.com` and password `test`

That's it! Changes made in `./src` will be reflected in your app. See the [Development](#development) section for more details.

## How it works

This encryption and decryption process utilizes two key Payload hooks: [BeforeChange](https://payloadcms.com/docs/hooks/collections#beforechange) and [AfterRead](https://payloadcms.com/docs/hooks/collections#afterread).

1. Navigate to `src/collections/Users/index.ts` - this is where some personal information about the user is stored, e.g. a `Date of Birth` field. Here, we are also calling the two key Payload hooks needed for encryption and decryption of this field - `BeforeChange` and `AfterRead`.

2. `BeforeChange`: Here, the data undergoes encryption, ensuring what gets stored isn’t the raw data users entered.

3. `AfterRead`: Just before Payload sends back the information via its API, `AfterRead` decrypts it, ensuring that your application gets readable data.

The `encryptField` hook ensures any text being saved is disguised (encrypted)

The `decryptField` hook makes sure the disguised text is made understandable (decrypted) when it’s needed again.

4. The `encryptField` and `decryptField` hooks use Node’s crypto module. They rely on an environmental variable, `PAYLOAD_SECRET`, as the secret key, ensuring it's secure. Each encryption uses a unique initialization Vector (IV) for better security, employing the AES-256-CTR encryption algorithm. Decryption reverses this process.

5. We then set up a custom endpoint to fetch the decrypted Date of Birth field at `src/collections/Users/endpoints/getUserDOB.ts`.

### Seed

On boot, a seed script is included to create a user and a home page.

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).

