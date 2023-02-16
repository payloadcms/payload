# Virtual Fields Example for PayloadCMS

This example demonstrates multiple use-cases for virtual fields.

The following software is required:
- Yarn or NPM
- NodeJS version 10+
- A Mongo Database - IMPORTANT: you need to either have MongoDB running locally, or have signed up for a free MongoDB Atlas server in order to run this example locally.

## Running locally

[- Step 1. Copy example](#step-1-copy-example)

[- Step 2. Set up the environment variables](#step-2-set-up-the-environment-variables)

[- Step 3. Add dependencies and seed data](#step-3-add-dependencies-and-seed-data)

[- Step 4. Start development server](#step-4-start-development-server)

### Step 1. Copy example

Copy this example with [Degit](https://www.npmjs.com/package/degit) by running the following command at your terminal:

```bash
npx degit github:payloadcms/payload/examples/virtualFields
```

### Step 2. Set up the environment variables

Copy the `.env.example` file in this directory to `.env`:

```bash
cp .env.example .env
```

Make sure to enter values for `PAYLOAD_SECRET` and `MONGO_URI`. If you have MongoDB running locally, then you can use the example connection string, but if you are using Mongo Atlas or similar, you'll want to fill this value in with your own connection string.

### Step 3. Add dependencies

Install dependencies:
```bash
yarn
```

### Step 4. Seed data and start development server

If this is your first time booting up the demo, seed in the initial data and start your development server by running:
```bash
yarn seed
```

Seeding will drop any existing database and add example data. You only need to do this once on startup, or if you want to reset your data at any point.

If you have already seeded in the data, start the development server with:
```bash
yarn dev
```

Your CMS should now be up and running on [http://localhost:3000/admin](http://localhost:3000/admin).

The credentials to login will be:
```bash
email: demo@payloadcms.com
password: demo
```

NOTE: If you have not seeded the initial data, these credentials will not exist and you will need to create your own first user.

## Virtual Fields walkthrough

The term *virtual field* is used to describe any field that is not stored in the database and has its value populated within an `afterRead` hook.

In this example you have three collections: Locations, Events and Staff.

#### Locations Collection

In the locations collection, you have separate text fields to input a city, state and country.

Everything else here are virtual fields:

`location`: Text field providing a formatted location name by concatenating `city + state + country` which is then used as the document title

`events`: Relationship field containing all events associated with the location.

`nextEvent`: Relationship field that returns the event with the closest date at this location.

`staff`: Relationship field containing all staff associated with the location.

#### Events Collection

This collection takes an event name and date. You will select the event location from the options you have created in the location collection.

Next we have the Ticket fields, you can input the ticket price, sales tax and additional fees - then our virtual field will calculate the total price for you:

`totalPrice`: Number field that is automatically populated by the sum of `price * tax + fees`

#### Staff Collection

The staff collection contains text fields for a title, first and last name.

Similarly to Events, you will assign a location to the staff member from the options you created previously.

This collection uses the following virtual field to format the staff name fields:

`fullTitle`: Text field providing a formatted name by concatenating `title + firstName + lastName` which is then used as the document title

In the code, navigate to `src/collections` to see how these fields are functioning and read more about `afterRead` hooks [here](https://payloadcms.com/docs/hooks/fields).

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/r6sCXqVk3v) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
