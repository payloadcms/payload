# Payload Virtual Fields Example

This example demonstrates how to implement virtual fields into Payload.

## Quick Start

To spin up this example locally, follow these steps:

1. Clone this repo
2. `cd` into this directory and run `yarn` or `npm install`
3. `cp .env.example .env` to copy the example environment variables
4. `yarn dev` or `npm run dev` to start the server and seed the database
5. `open http://localhost:8000/admin` to access the admin panel
6. Login with email `dev@payloadcms.com` and password `test`

## How it works

The term _virtual field_ is used to describe any field that is not stored in the database and has its value populated within an `afterRead` hook.

In this example you have three collections: Locations, Events and Staff.

### Locations Collection

In the locations collection, you have separate text fields to input a city, state and country.

Everything else here are virtual fields:

`location`: Text field providing a formatted location name by concatenating `city + state + country` which is then used as the document title.

`events`: Relationship field containing all events associated with the location.

`nextEvent`: Relationship field that returns the event with the closest date at this location.

`staff`: Relationship field containing all staff associated with the location.

### Events Collection

This collection takes an event name and date. You will select the event location from the options you have created in the location collection.

Next we have the Ticket fields, you can input the ticket price, sales tax and additional fees - then our virtual field will calculate the total price for you:

`totalPrice`: Number field that is automatically populated by the sum of `price * tax + fees`

### Staff Collection

The staff collection contains text fields for a title, first and last name.

Similarly to Events, you will assign a location to the staff member from the options you created previously.

This collection uses the following virtual field to format the staff name fields:

`fullTitle`: Text field providing a formatted name by concatenating `title + firstName + lastName` which is then used as the document title.

In the code, navigate to `src/collections` to see how these fields are populated and read more about `afterRead` hooks [here](https://payloadcms.com/docs/hooks).

## Development

To spin up this example locally, follow the [Quick Start](#quick-start).

### Seed

On boot, a seed script is included to create a user, a home page, and a the following redirects for you to test with:

- From `/redirect-to-external` to `https://payloadcms.com`
- From `/redirect-to-internal` to `/redirected`

## Production

To run Payload in production, you need to build and serve the Admin panel. To do so, follow these steps:

1. First invoke the `payload build` script by running `yarn build` or `npm run build` in your project root. This creates a `./build` directory with a production-ready admin bundle.
1. Then run `yarn serve` or `npm run serve` to run Node in production and serve Payload from the `./build` directory.

### Deployment

The easiest way to deploy your project is to use [Payload Cloud](https://payloadcms.com/new/import), a one-click hosting solution to deploy production-ready instances of your Payload apps directly from your GitHub repo. You can also deploy your app manually, check out the [deployment documentation](https://payloadcms.com/docs/production/deployment) for full details.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/r6sCXqVk3v) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
