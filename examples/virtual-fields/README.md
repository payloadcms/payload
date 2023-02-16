# Virtual Fields Example for Payload CMS

This example demonstrates multiple use-cases for virtual fields.

## Getting Started

First copy this example with [Degit](https://www.npmjs.com/package/degit) by running the following command at your terminal:

```bash
npx degit github:payloadcms/payload/examples/virtual-fields
```

1. `cd` into this directory and run `yarn` or `npm install`
2. `cp .env.example .env` to copy the example environment variables
3. `yarn dev` or `npm run dev` to start the server and seed the database
4. `open http://localhost:3000/admin` to access the admin panel
5. Login with email `dev@payloadcms.com` and password `test`


## How It Works

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
