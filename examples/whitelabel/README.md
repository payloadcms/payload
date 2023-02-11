# Whitelabeled Example for PayloadCMS

This example demonstrates how to rebrand the admin panel by modifying the favicon, icon, logo, ogImage and title suffix.

To use this example, you'll need the following software:
- Yarn or NPM
- NodeJS version 10+
- A Mongo Database - IMPORTANT: you need to either have MongoDB running locally, or have signed up for a free MongoDB Atlas server in order to test this repo locally.

## Running locally

[- Step 1. Copy example](#step-1-copy-example)

[- Step 2. Set up the environment variables](#step-2-set-up-the-environment-variables)

[- Step 3. Start the development server](#step-3-add-dependencies-and-start-the-development-server)

### Step 1. Copy example

Copy the example by running the following command at your terminal:

```bash
npx degit github:payloadcms/payload/examples/whitelabel
```

### Step 2. Set up the environment variables

Copy the `.env.example` file in this directory to `.env`:

```bash
cp .env.example .env
```

Typically, the only line that you'll need to change within your new .env for local development is the `MONGO_URI` value. If you have MongoDB running locally, then you can use the example connection string, but if you are using Mongo Atlas or similar, you'll want to fill this value in with your own connection string.

### Step 3. Add dependencies and start the development server

```bash
yarn
yarn dev
```

Your CMS should now be up and running on [http://localhost:3000/admin](http://localhost:3000/admin).

## Rebranding walkthrough

Start by navigating to the `payload.config.ts` file and then take a look at the admin property.

The following sub-properties have already been configured:

`favicon`: Image that will be displayed as the tab icon.

`ogImage`: Image that will appear in the preview when you share links to your admin panel online and through social media.

`titleSuffix`: Text that appends the meta/page title displayed in the browser tab — *must be a string*.

`graphics.Logo`: Image component to be displayed as the logo on the Sign Up / Login view.

`graphics.Icon`: Image component displayed above the Nav in the admin panel, often a condensed version of a full logo.

👉 Check out this blog post for a more in-depth walkthrough: [White-label the Admin UI](https://payloadcms.com/blog/white-label-admin-ui)

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/r6sCXqVk3v) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
